import { NextRequest, NextResponse } from "next/server";
import { listLaws } from "@/lib/db";
import { createStructuredLaw, type RawLawInput } from "@/lib/rag/laws";
import { runMonitoringForLaw } from "@/lib/rag/monitoring";
import type { ImpactUrgency } from "@/lib/rag/types";

const VALID_URGENCY = new Set(["Low", "Medium", "High", "Critical"]);

function parseLawInput(value: unknown): RawLawInput {
  const body = value as Partial<RawLawInput>;

  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object.");
  }

  for (const field of ["title", "source", "jurisdiction", "category", "newText"] as const) {
    if (typeof body[field] !== "string" || !body[field]?.trim()) {
      throw new Error(`Missing required law field: ${field}`);
    }
  }

  if (typeof body.urgency !== "string" || !VALID_URGENCY.has(body.urgency)) {
    throw new Error("urgency must be one of Low, Medium, High, Critical.");
  }

  return {
    title: String(body.title).trim(),
    source: String(body.source).trim(),
    sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : undefined,
    seedId: typeof body.seedId === "string" ? body.seedId.trim() : undefined,
    jurisdiction: String(body.jurisdiction).trim(),
    category: String(body.category).trim(),
    urgency: body.urgency as ImpactUrgency,
    oldText: body.oldText,
    newText: String(body.newText).trim(),
    summary: body.summary,
    risk: body.risk,
  };
}

export async function POST(req: NextRequest) {
  try {
    const input = parseLawInput(await req.json());
    const law = await createStructuredLaw(input);
    let monitoring;

    try {
      monitoring = await runMonitoringForLaw({ law });
    } catch (error) {
      monitoring = {
        scannedProjects: 0,
        affectedProjects: 0,
        notificationsCreated: 0,
        results: [],
        error: error instanceof Error ? error.message : "Unable to run law monitoring.",
      };
    }

    return NextResponse.json({ law, monitoring });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create law." },
      { status: 400 },
    );
  }
}

export async function GET() {
  try {
    const laws = await listLaws();

    return NextResponse.json({ laws });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list laws." },
      { status: 500 },
    );
  }
}
