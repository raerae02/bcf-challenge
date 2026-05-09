import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON, type FileInput } from "@/lib/gemini";
import { getRegulations, getAlerts } from "@/lib/data";
import { matchRegulations, matchAlerts } from "@/lib/matcher";
import { processFile } from "@/lib/fileParser";
import type {
  ProjectProfile,
  AnalyzedRegulation,
  RegulatorySnapshot,
} from "@/lib/types";

const EXTRACT_PROFILE_PROMPT = `You are an expert in Quebec and Montreal business regulations.

Extract structured information about a business venture from the user's description AND any attached documents (project plans, contracts, leases, business plans).

When attached documents are present, read them carefully and extract details such as: business type, address/location, square footage, number of employees, planned activities, special clauses or considerations.

Return ONLY valid JSON matching this schema:
{
  "businessType": "bakery" | "restaurant" | "café" | "retail" | "office" | "construction" | "medical" | "other",
  "activities": string[],
  "location": { "city": string, "borough": string | null },
  "scale": { "squareFeet": number | null, "employees": number | null },
  "considerations": string[]
}

Activities can include: food_preparation, food_service, alcohol_service, outdoor_seating, retail_sales, construction, renovation, residential, multi_storey, medical_practice, signage, etc.

Be conservative — only include activities clearly stated or strongly implied.`;

const RISK_REPORT_PROMPT = `You are Permit Radar AI, producing a final risk assessment for a small business venture in Quebec.

Given the project profile and the list of applicable regulations and recent alerts, produce a consolidated risk report.

Return ONLY valid JSON:
{
  "executiveSummary": string,
  "topRisks": string[],
  "recommendedActions": string[],
  "disclaimer": string
}

Rules:
- Respond in English.
- Plain language, no legal jargon
- Prioritize by what the user should do FIRST
- Be specific to the project
- Always include a disclaimer recommending professional legal review`;

async function extractFromRequest(req: NextRequest): Promise<{
  description: string;
  files: {
    filename: string;
    buffer: Buffer;
    mimeType: string;
    inlineText: string | null;
  }[];
}> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const description = (formData.get("description") as string) || "";
    const fileBlobs = formData.getAll("files") as File[];

    const files = await Promise.all(
      fileBlobs
        .filter((f) => f && f.size > 0)
        .map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          return processFile(buffer, file.name, file.type);
        }),
    );

    return { description, files };
  } else {
    const { description } = await req.json();
    return { description: description || "", files: [] };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { description, files } = await extractFromRequest(req);

    if (!description && files.length === 0) {
      return NextResponse.json(
        { error: "Provide a project description or attach a document." },
        { status: 400 },
      );
    }

    // Build the combined prompt: description + inline text content (for txt/md)
    let combinedPrompt =
      description ||
      "(No text description provided. Refer to attached document(s).)";
    for (const file of files) {
      if (file.inlineText !== null) {
        combinedPrompt += `\n\n--- File: ${file.filename} ---\n${file.inlineText}`;
      }
    }

    // Files for Gemini's inline file input (PDFs only — text files are inlined above)
    const geminiFiles: FileInput[] = files
      .filter((f) => f.inlineText === null)
      .map((f) => ({
        data: f.buffer,
        mimeType: f.mimeType,
        filename: f.filename,
      }));

    // Step 1: Extract project profile (Gemini sees the PDF directly if attached)
    const profile = await callGeminiJSON<ProjectProfile>(
      combinedPrompt,
      EXTRACT_PROFILE_PROMPT,
      geminiFiles,
    );

    // Step 2: Match regulations
    const allRegulations = await getRegulations();
    const matched = matchRegulations(profile, allRegulations);

    // Step 3: Match alerts
    const allAlerts = await getAlerts();
    const matchedAlerts = matchAlerts(profile, allAlerts);

    // Step 4: Attach base data
    const analyzedRules: AnalyzedRegulation[] = matched.map((r) => ({
      ...r,
      personalizedSummary: r.summary.en || r.summary.fr,
      whyItApplies: `Applies because your project includes: ${profile.activities
        .filter((a) => r.appliesWhen.includes(a))
        .join(", ")}.`,
      recentChanges: matchedAlerts.filter((a) =>
        a.documentRefs.some((doc) => r.documentRefs.includes(doc)),
      ),
    }));

    // Step 5: Risk report
    const reportInput = JSON.stringify(
      {
        profile,
        regulations: matched.map((r) => ({
          title: r.title.en || r.title.fr,
          riskLevel: r.riskLevel,
        })),
        alerts: matchedAlerts.map((a) => ({
          title: a.title,
          urgency: a.urgency,
        })),
      },
      null,
      2,
    );

    let riskReport;
    try {
      riskReport = await callGeminiJSON<{
        executiveSummary: string;
        topRisks: string[];
        recommendedActions: string[];
        disclaimer: string;
      }>(reportInput, RISK_REPORT_PROMPT);
    } catch {
      riskReport = {
        executiveSummary: `Your ${profile.businessType} project in ${profile.location.city} has ${matched.length} applicable permits and regulations.`,
        topRisks: matched
          .filter((r) => r.riskLevel === "High" || r.riskLevel === "Critical")
          .map((r) => r.title.en || r.title.fr)
          .slice(0, 5),
        recommendedActions: ["Consult a specialized lawyer for validation."],
        disclaimer:
          "This is legal information, not legal advice. Consult a professional.",
      };
    }

    const riskOverview: "Low" | "Medium" | "High" | "Critical" = matched.some(
      (r) => r.riskLevel === "Critical",
    )
      ? "Critical"
      : matched.some((r) => r.riskLevel === "High")
        ? "High"
        : matched.some((r) => r.riskLevel === "Medium")
          ? "Medium"
          : "Low";

    const snapshot: RegulatorySnapshot & {
      attachedFilesProcessed?: { filename: string }[];
    } = {
      projectProfile: profile,
      totalApplicableRules: analyzedRules.length,
      riskOverview,
      rules: analyzedRules,
      recentAlerts: matchedAlerts,
      riskReport,
      attachedFilesProcessed: files.map((f) => ({ filename: f.filename })),
    };

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
