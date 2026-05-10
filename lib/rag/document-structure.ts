import { insertDocument, newId, upsertDocumentChunk } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { callAIJSON, type FileInput } from "@/lib/ai";
import type { ProcessedFile } from "@/lib/fileParser";
import type { StructuredClause, StructuredDocument } from "@/lib/rag/types";

export const EXTRACT_DOCUMENT_STRUCTURE_PROMPT = `You are Regulation Radar AI, a legal-tech document analyst for Quebec construction, permitting, zoning, and compliance projects.

Analyze every attached or inlined project document and separate it into sections, clauses, subclauses, paragraphs, or schedules. The goal is to make later regulatory updates cite the exact sub-clause or subsection that may be affected.

Return ONLY valid JSON matching this schema:
{
  "documents": [
    {
      "filename": string,
      "documentType": string,
      "title": string,
      "summary": string,
      "clauses": [
        {
          "id": string,
          "title": string,
          "type": "section" | "clause" | "subclause" | "paragraph" | "schedule" | "other",
          "pageStart": number | null,
          "pageEnd": number | null,
          "text": string,
          "keyObligations": string[],
          "riskSignals": string[],
          "parties": string[],
          "tags": string[],
          "children": []
        }
      ]
    }
  ]
}

Rules:
- Preserve the document hierarchy when visible: article -> section -> clause -> subclause.
- Use stable ids such as "1", "1.1", "2.3(a)", "schedule-a", or clear generated ids when the document has no numbering.
- Keep clause text concise but specific enough to support later law-impact matching.
- Use pageStart/pageEnd when visible from the PDF; otherwise use null.
- keyObligations should capture duties, deadlines, required documents, approvals, payment obligations, permit conditions, compliance duties, indemnities, delays, inspection requirements, or design constraints.
- riskSignals should capture anything that could be affected by a new law: permit delay, zoning compliance, redesign, municipal approval, green space, fire safety, construction code, contractor risk, operational/legal compliance, cost or schedule impact.
- tags should be normalized keywords such as zoning, permit, green_space, fire_safety, construction_code, contract_delay, indemnity, terrace, signage, food_safety.
- Do not invent clauses. If the document is too visual or unclear, return a short clause explaining what can be read and tag it "manual_review".
- This is document intelligence for legal information, not legal advice.`;

type DocumentStructureResponse = {
  documents: StructuredDocument[];
};

export function normalizeClauseId(filename: string, index: number) {
  return `${filename
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()}-${index + 1}`;
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function normalizeClause(
  clause: Partial<StructuredClause>,
  fallbackId: string,
): StructuredClause {
  return {
    id: clause.id || fallbackId,
    title: clause.title || clause.text?.slice(0, 80) || "Untitled clause",
    type: clause.type || "other",
    pageStart: typeof clause.pageStart === "number" ? clause.pageStart : null,
    pageEnd: typeof clause.pageEnd === "number" ? clause.pageEnd : null,
    text: clause.text || "",
    keyObligations: safeArray(clause.keyObligations),
    riskSignals: safeArray(clause.riskSignals),
    parties: safeArray(clause.parties),
    tags: safeArray(clause.tags),
    children: Array.isArray(clause.children)
      ? clause.children.map((child, index) =>
          normalizeClause(child, `${clause.id || fallbackId}.${index + 1}`),
        )
      : [],
  };
}

export function fallbackClausesFromInlineText(file: {
  filename: string;
  inlineText: string | null;
}): StructuredDocument {
  if (!file.inlineText) {
    return {
      filename: file.filename,
      documentType: "PDF or native document",
      title: file.filename,
      summary:
        "Document was provided as a native file. Clause extraction requires AI review of the attachment.",
      clauses: [
        {
          id: normalizeClauseId(file.filename, 0),
          title: "Manual review required",
          type: "other",
          pageStart: null,
          pageEnd: null,
          text: "The document could not be converted into clauses by the fallback extractor.",
          keyObligations: [],
          riskSignals: ["manual_review"],
          parties: [],
          tags: ["manual_review"],
          children: [],
        },
      ],
    };
  }

  const paragraphs = file.inlineText
    .split(/\n\s*\n|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 30)
    .slice(0, 40);

  const clauses: StructuredClause[] = paragraphs.map((paragraph, index) => ({
    id: normalizeClauseId(file.filename, index),
    title: paragraph.slice(0, 80),
    type: /^\d+(\.\d+)*\b/.test(paragraph) ? "clause" : "paragraph",
    pageStart: null,
    pageEnd: null,
    text: paragraph,
    keyObligations: [],
    riskSignals: [],
    parties: [],
    tags: [],
    children: [],
  }));

  return {
    filename: file.filename,
    documentType: "Text document",
    title: file.filename,
    summary: `Fallback extraction identified ${clauses.length} text sections.`,
    clauses:
      clauses.length > 0
        ? clauses
        : [
            {
              id: normalizeClauseId(file.filename, 0),
              title: "Document text",
              type: "paragraph",
              pageStart: null,
              pageEnd: null,
              text: file.inlineText.slice(0, 1000),
              keyObligations: [],
              riskSignals: [],
              parties: [],
              tags: [],
              children: [],
            },
          ],
  };
}

export function fallbackDocumentStructure(
  files: { filename: string; inlineText: string | null }[],
): StructuredDocument[] {
  return files.map(fallbackClausesFromInlineText);
}

export function normalizeDocumentStructure(
  result: DocumentStructureResponse,
  files: { filename: string; inlineText: string | null }[],
): StructuredDocument[] {
  const fallbacks = fallbackDocumentStructure(files);

  return files.map((file, index) => {
    const extracted =
      result.documents.find(
        (document) => document.filename === file.filename,
      ) ?? result.documents[index];
    const fallback = fallbacks[index];

    if (!extracted) {
      return fallback;
    }

    return {
      filename: extracted.filename || file.filename,
      documentType: extracted.documentType || fallback.documentType,
      title: extracted.title || fallback.title,
      summary: extracted.summary || fallback.summary,
      clauses:
        Array.isArray(extracted.clauses) && extracted.clauses.length > 0
          ? extracted.clauses.map((clause, clauseIndex) =>
              normalizeClause(
                clause,
                normalizeClauseId(file.filename, clauseIndex),
              ),
            )
          : fallback.clauses,
    };
  });
}

export async function analyzeDocumentStructure({
  combinedPrompt,
  files,
  aiFiles,
}: {
  combinedPrompt: string;
  files: ProcessedFile[];
  aiFiles: FileInput[];
}): Promise<StructuredDocument[]> {
  const documentStructurePrompt = [
    combinedPrompt,
    "",
    "Attached file order:",
    ...files.map(
      (file, index) => `${index + 1}. ${file.filename} (${file.mimeType})`,
    ),
  ].join("\n");

  try {
    const documentStructure = await callAIJSON<DocumentStructureResponse>(
      documentStructurePrompt,
      EXTRACT_DOCUMENT_STRUCTURE_PROMPT,
      aiFiles,
    );

    return normalizeDocumentStructure(documentStructure, files);
  } catch {
    return fallbackDocumentStructure(files);
  }
}

export type FlatClause = {
  clause: StructuredClause;
  path: string[];
};

export function flattenDocumentClauses(
  document: StructuredDocument,
  clauses = document.clauses,
  parentPath: string[] = [],
): FlatClause[] {
  return clauses.flatMap((clause) => {
    const label = [clause.id, clause.title].filter(Boolean).join(" ");
    const path = [...parentPath, label];
    const current = { clause, path };
    const children = clause.children?.length
      ? flattenDocumentClauses(document, clause.children, path)
      : [];

    return [current, ...children];
  });
}

export function buildSubclauseEmbeddingText(
  clause: StructuredClause,
  document: StructuredDocument,
) {
  return [
    `Document: ${document.title}`,
    `File: ${document.filename}`,
    `Type: ${document.documentType}`,
    `Clause: ${clause.id} ${clause.title}`,
    `Clause type: ${clause.type}`,
    `Text: ${clause.text}`,
    `Key obligations: ${clause.keyObligations.join("; ")}`,
    `Risk signals: ${clause.riskSignals.join("; ")}`,
    `Parties: ${clause.parties.join("; ")}`,
    `Tags: ${clause.tags.join("; ")}`,
  ]
    .filter((part) => !part.endsWith(": "))
    .join("\n");
}

export async function createDocumentWithSubclauseVectors({
  projectId,
  file,
  analyzedDocument,
}: {
  projectId: string;
  file: ProcessedFile;
  analyzedDocument: StructuredDocument;
}) {
  const now = new Date().toISOString();
  const documentId = newId("doc");
  const flatClauses = flattenDocumentClauses(analyzedDocument).filter(
    ({ clause }) =>
      clause.text.trim().length > 0 || clause.title.trim().length > 0,
  );

  await insertDocument({
    id: documentId,
    projectId,
    fileName: file.filename,
    type: analyzedDocument.documentType,
    summary: analyzedDocument.summary,
    tags: Array.from(
      new Set(flatClauses.flatMap(({ clause }) => clause.tags)),
    ),
    text: file.inlineText ?? undefined,
    structured: analyzedDocument,
    createdAt: now,
  });

  for (const [chunkIndex, { clause, path }] of flatClauses.entries()) {
    const text = buildSubclauseEmbeddingText(clause, analyzedDocument);
    const embedding = await generateEmbedding(text);

    await upsertDocumentChunk({
      id: newId("chunk"),
      projectId,
      documentId,
      fileName: file.filename,
      chunkIndex,
      text,
      embedding,
      clauseId: clause.id,
      clauseTitle: clause.title,
      clauseType: clause.type,
      pageStart: clause.pageStart,
      pageEnd: clause.pageEnd,
      keyObligations: clause.keyObligations,
      riskSignals: clause.riskSignals,
      parties: clause.parties,
      tags: clause.tags,
      path,
      createdAt: now,
    });
  }

  return {
    documentId,
    chunkCount: flatClauses.length,
  };
}
