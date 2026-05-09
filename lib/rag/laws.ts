import { db } from "@/lib/firebase-admin";
import { generateEmbedding } from "@/lib/embeddings";
import { callGeminiJSON } from "@/lib/gemini";
import type { ImpactUrgency, LawUpdate, StructuredLawUpdate } from "@/lib/rag/types";

const STRUCTURE_LAW_PROMPT = `You are Permit Radar AI, a Quebec construction permit and compliance analyst.

Convert the raw law, regulation, municipal bylaw, permit rule, or compliance update into structured JSON for retrieval and impact analysis.

Return ONLY valid JSON with this shape:
{
  "title": string,
  "source": string,
  "jurisdiction": string,
  "category": string,
  "urgency": "Low" | "Medium" | "High" | "Critical",
  "summary": string,
  "effectiveChange": string,
  "obligations": string[],
  "affectedProjectFeatures": string[],
  "keywords": string[],
  "legalRiskThemes": string[],
  "oldText": string | undefined,
  "newText": string,
  "risk": string | undefined
}

Rules:
- Be conservative and do not invent legal obligations.
- Extract obligations only when supported by the text.
- affectedProjectFeatures should name project/document concepts likely to match uploaded files, such as green space, site plan, fire safety, contractor delay, zoning, permit approval, residential height, terrace, signage, food safety.
- keywords should use normalized retrieval tags such as green_space, site_plan, residential, permit_delay, fire_safety, construction_code.
- This is legal and permitting information, not legal advice.`;

export type RawLawInput = {
  title: string;
  source: string;
  jurisdiction: string;
  category: string;
  urgency: ImpactUrgency;
  oldText?: string;
  newText: string;
  summary?: string;
  risk?: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    ) as T;
  }

  return value;
}

function tokenizeTags(text: string) {
  const normalized = text.toLowerCase();
  const tags: string[] = [];

  if (normalized.includes("green") || normalized.includes("landscap")) tags.push("green_space");
  if (normalized.includes("site plan")) tags.push("site_plan");
  if (normalized.includes("permit")) tags.push("permit", "permit_delay");
  if (normalized.includes("residential")) tags.push("residential");
  if (normalized.includes("storey") || normalized.includes("storeys")) tags.push("multi_storey");
  if (normalized.includes("fire")) tags.push("fire_safety");
  if (normalized.includes("zoning")) tags.push("zoning");
  if (normalized.includes("contract")) tags.push("contract_risk");
  if (normalized.includes("delay")) tags.push("delay");

  return unique(tags);
}

export function fallbackStructuredLaw(input: RawLawInput): StructuredLawUpdate {
  const combined = [input.title, input.category, input.summary, input.risk, input.oldText, input.newText]
    .filter(Boolean)
    .join(" ");
  const keywords = tokenizeTags(combined);

  return {
    title: input.title,
    source: input.source,
    jurisdiction: input.jurisdiction,
    category: input.category,
    urgency: input.urgency,
    summary: input.summary || input.newText.slice(0, 240),
    effectiveChange: input.newText,
    obligations: [input.newText],
    affectedProjectFeatures: keywords,
    keywords,
    legalRiskThemes: input.risk ? [input.risk] : ["permit or compliance impact"],
    oldText: input.oldText,
    newText: input.newText,
    risk: input.risk,
  };
}

export async function structureLawWithGemini(input: RawLawInput): Promise<StructuredLawUpdate> {
  try {
    return await callGeminiJSON<StructuredLawUpdate>(
      JSON.stringify(input, null, 2),
      STRUCTURE_LAW_PROMPT,
    );
  } catch {
    return fallbackStructuredLaw(input);
  }
}

export function buildStructuredLawEmbeddingText(law: StructuredLawUpdate) {
  return [
    law.title,
    law.source,
    law.jurisdiction,
    law.category,
    law.urgency,
    law.summary,
    law.effectiveChange,
    law.obligations.join("; "),
    law.affectedProjectFeatures.join("; "),
    law.keywords.join("; "),
    law.legalRiskThemes.join("; "),
    law.oldText,
    law.newText,
    law.risk,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function createStructuredLaw(input: RawLawInput): Promise<LawUpdate> {
  const structured = await structureLawWithGemini(input);
  const embedding = await generateEmbedding(buildStructuredLawEmbeddingText(structured));
  const lawRef = db.collection("laws").doc();
  const law: LawUpdate = {
    id: lawRef.id,
    title: structured.title || input.title,
    source: structured.source || input.source,
    jurisdiction: structured.jurisdiction || input.jurisdiction,
    category: structured.category || input.category,
    urgency: structured.urgency || input.urgency,
    oldText: structured.oldText ?? input.oldText,
    newText: structured.newText || input.newText,
    summary: structured.summary || input.summary,
    risk: structured.risk || input.risk,
    structured,
    embedding,
    createdAt: new Date().toISOString(),
  };

  await lawRef.set(stripUndefined(law));

  return law;
}
