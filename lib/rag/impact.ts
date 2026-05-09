import { callGeminiJSON } from "@/lib/gemini";
import type {
  AffectedSubclause,
  ImpactScanDraft,
  ImpactUrgency,
  LawUpdate,
  Project,
  ScoredDocumentChunk,
  StructuredLawUpdate,
} from "@/lib/rag/types";

const ANALYZE_SUBCLAUSE_IMPACT_PROMPT = `You are Regulation Radar AI, a construction permit and compliance analyst.

A law, regulation, municipal bylaw, permit rule, or compliance requirement has changed. Determine exactly which retrieved document subclauses are likely affected.

Return ONLY valid JSON with this shape:
{
  "affectedDocuments": [
    {
      "documentId": string,
      "fileName": string,
      "affectedSubclauses": [
        {
          "chunkId": string,
          "clauseId": string,
          "clauseTitle": string,
          "pageStart": number | null,
          "pageEnd": number | null,
          "impactLevel": "Low" | "Medium" | "High" | "Critical",
          "reason": string,
          "recommendedAction": string
        }
      ]
    }
  ],
  "notificationDraft": {
    "title": string,
    "message": string,
    "urgency": "Low" | "Medium" | "High" | "Critical"
  }
}

Rules:
- Only mark a subclause as affected if there is a clear relationship between the structured law and the subclause.
- Focus on permit delays, zoning compliance, required documents, project redesign, municipal approval, construction code, contract/compliance risk, and legal operational risk.
- Do not invent exact legal obligations if the source does not support them.
- Cite the exact chunkId and clauseId from retrieved subclauses.
- This is legal and permitting information, not legal advice.
- High-impact issues should be reviewed by a qualified legal, municipal, or permitting professional.
- Do not create or store a notification. Only draft one for preview.`;

type ImpactAnalysisPayload = Pick<
  ImpactScanDraft,
  "affectedDocuments" | "notificationDraft"
>;

function urgencyRank(urgency: ImpactUrgency) {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[urgency];
}

function maxUrgency(
  values: ImpactUrgency[],
  fallback: ImpactUrgency,
): ImpactUrgency {
  return values.reduce(
    (current, next) =>
      urgencyRank(next) > urgencyRank(current) ? next : current,
    fallback,
  );
}

function lawForPrompt(law: LawUpdate): StructuredLawUpdate | LawUpdate {
  return law.structured ?? law;
}

function tokenOverlap(left: string, right: string) {
  const leftTokens = new Set(
    left
      .toLowerCase()
      .match(/[a-z0-9_]+/g)
      ?.filter((token) => token.length > 3) ?? [],
  );

  return (
    right
      .toLowerCase()
      .match(/[a-z0-9_]+/g)
      ?.filter((token) => leftTokens.has(token)).length ?? 0
  );
}

function fallbackImpactAnalysis({
  project,
  law,
  chunks,
}: {
  project: Project;
  law: LawUpdate;
  chunks: ScoredDocumentChunk[];
}): ImpactAnalysisPayload {
  const structured = lawForPrompt(law);
  const lawText = JSON.stringify(structured);
  const affected = chunks
    .map((chunk) => {
      const overlap = tokenOverlap(
        lawText,
        [
          chunk.text,
          chunk.clauseTitle,
          chunk.keyObligations?.join(" "),
          chunk.riskSignals?.join(" "),
          chunk.tags?.join(" "),
        ].join(" "),
      );
      const score = (chunk.score ?? 0) + overlap / 10;

      if (score < 0.25) {
        return null;
      }

      const impactLevel: ImpactUrgency =
        law.urgency === "Critical" || score > 1.2
          ? "Critical"
          : law.urgency === "High" || score > 0.75
            ? "High"
            : score > 0.45
              ? "Medium"
              : "Low";

      return {
        documentId: chunk.documentId,
        fileName: chunk.fileName,
        subclause: {
          chunkId: chunk.id,
          clauseId: chunk.clauseId ?? String(chunk.chunkIndex),
          clauseTitle: chunk.clauseTitle ?? "Untitled clause",
          pageStart: chunk.pageStart ?? null,
          pageEnd: chunk.pageEnd ?? null,
          impactLevel,
          reason: `This subclause appears related to ${law.title} based on retrieved semantic and keyword overlap with the law update.`,
          recommendedAction:
            "Review this subclause against the new requirement with a qualified legal, municipal, or permitting professional.",
        } satisfies AffectedSubclause,
      };
    })
    .filter(Boolean) as {
    documentId: string;
    fileName: string;
    subclause: AffectedSubclause;
  }[];
  const grouped = new Map<
    string,
    {
      documentId: string;
      fileName: string;
      affectedSubclauses: AffectedSubclause[];
    }
  >();

  for (const item of affected) {
    const key = item.documentId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        documentId: item.documentId,
        fileName: item.fileName,
        affectedSubclauses: [],
      });
    }
    grouped.get(key)?.affectedSubclauses.push(item.subclause);
  }

  const affectedDocuments = Array.from(grouped.values());
  const urgency = maxUrgency(
    affected.flatMap((item) => [item.subclause.impactLevel]),
    law.urgency,
  );

  return {
    affectedDocuments,
    notificationDraft: {
      title: affectedDocuments.length
        ? `${law.title} may affect ${affected.length} subclause${affected.length === 1 ? "" : "s"}`
        : `${law.title} scanned with no clear subclause impact`,
      message: affectedDocuments.length
        ? `Regulation Radar found likely subclause-level impacts for ${project.name}.`
        : `Regulation Radar did not find a clear relationship between this update and the retrieved subclauses.`,
      urgency,
    },
  };
}

export async function analyzeAffectedSubclausesWithGemini({
  project,
  law,
  chunks,
}: {
  project: Project;
  law: LawUpdate;
  chunks: ScoredDocumentChunk[];
}): Promise<ImpactAnalysisPayload> {
  const fallback = () => fallbackImpactAnalysis({ project, law, chunks });

  try {
    return await callGeminiJSON<ImpactAnalysisPayload>(
      JSON.stringify(
        {
          project,
          law: lawForPrompt(law),
          retrievedSubclauses: chunks,
        },
        null,
        2,
      ),
      ANALYZE_SUBCLAUSE_IMPACT_PROMPT,
    );
  } catch {
    return fallback();
  }
}
