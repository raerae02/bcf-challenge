import postgres from "postgres";
import type {
  DocumentChunk,
  ImpactNotification,
  LawUpdate,
  Project,
  ProjectDocument,
  ScoredDocumentChunk,
} from "@/lib/rag/types";

const DEFAULT_DATABASE_URL =
  "postgres://permit_radar:permit_radar@localhost:5433/permit_radar";
const VECTOR_DIMENSIONS = 768;

export const sql = postgres(process.env.DATABASE_URL || DEFAULT_DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function toVectorLiteral(vector: number[]) {
  const normalized = Array.from({ length: VECTOR_DIMENSIONS }, (_, index) => {
    const value = vector[index] ?? 0;
    return Number.isFinite(value) ? value : 0;
  });

  return `[${normalized.join(",")}]`;
}

function toJson(value: unknown) {
  return sql.json(value as Parameters<typeof sql.json>[0]);
}

function parseJsonArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function parseVector(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is number => typeof entry === "number");
  }

  if (typeof value === "string") {
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry));
  }

  return [];
}

function toIsoString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === "string" ? value : new Date().toISOString();
}

export type ProjectRow = {
  id: string;
  name: string;
  location: string;
  borough: string | null;
  project_type: string;
  use: string;
  height: string | null;
  units: number | null;
  permit_stage: string | null;
  sensitive_factors: unknown;
  created_at: Date | string;
};

export type DocumentChunkInput = DocumentChunk;

export function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    borough: row.borough ?? undefined,
    projectType: row.project_type,
    use: row.use,
    height: row.height ?? undefined,
    units: row.units ?? undefined,
    permitStage: row.permit_stage ?? undefined,
    sensitiveFactors: parseJsonArray(row.sensitive_factors),
    createdAt: toIsoString(row.created_at),
  };
}

export function rowToLaw(row: Record<string, unknown>): LawUpdate {
  return {
    id: String(row.id),
    seedId: typeof row.seed_id === "string" ? row.seed_id : undefined,
    title: String(row.title),
    source: String(row.source),
    sourceUrl: typeof row.source_url === "string" ? row.source_url : undefined,
    jurisdiction: String(row.jurisdiction),
    category: String(row.category),
    urgency: row.urgency as LawUpdate["urgency"],
    oldText: typeof row.old_text === "string" ? row.old_text : undefined,
    newText: String(row.new_text),
    summary: typeof row.summary === "string" ? row.summary : undefined,
    risk: typeof row.risk === "string" ? row.risk : undefined,
    structured: row.structured as LawUpdate["structured"],
    embedding: parseVector(row.embedding),
    createdAt: toIsoString(row.created_at),
  };
}

export function rowToChunk(row: Record<string, unknown>): ScoredDocumentChunk {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    documentId: String(row.document_id),
    fileName: String(row.file_name),
    chunkIndex: Number(row.chunk_index || 0),
    text: String(row.text || ""),
    embedding: parseVector(row.embedding),
    clauseId: typeof row.clause_id === "string" ? row.clause_id : undefined,
    clauseTitle: typeof row.clause_title === "string" ? row.clause_title : undefined,
    clauseType: row.clause_type as DocumentChunk["clauseType"],
    pageStart: typeof row.page_start === "number" ? row.page_start : null,
    pageEnd: typeof row.page_end === "number" ? row.page_end : null,
    keyObligations: parseJsonArray(row.key_obligations),
    riskSignals: parseJsonArray(row.risk_signals),
    parties: parseJsonArray(row.parties),
    tags: parseJsonArray(row.tags),
    path: parseJsonArray(row.path),
    createdAt: toIsoString(row.created_at),
    vectorScore:
      typeof row.vector_score === "number" ? Math.max(0, Math.min(1, 1 - row.vector_score)) : undefined,
    score:
      typeof row.vector_score === "number" ? Math.max(0, Math.min(1, 1 - row.vector_score)) : undefined,
  };
}

export function rowToNotification(row: Record<string, unknown>): ImpactNotification {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    lawId: String(row.law_id),
    title: String(row.title),
    message: String(row.message),
    urgency: row.urgency as ImpactNotification["urgency"],
    affectedDocuments: Array.isArray(row.affected_documents)
      ? row.affected_documents as ImpactNotification["affectedDocuments"]
      : [],
    createdAt: toIsoString(row.created_at),
    read: Boolean(row.read),
  };
}

export async function upsertProject(project: Project & { profile?: unknown }) {
  await sql`
    INSERT INTO projects (
      id, name, location, borough, project_type, use, height, units,
      permit_stage, sensitive_factors, profile, created_at
    )
    VALUES (
      ${project.id}, ${project.name}, ${project.location}, ${project.borough ?? null},
      ${project.projectType}, ${project.use}, ${project.height ?? null}, ${project.units ?? null},
      ${project.permitStage ?? null}, ${toJson(project.sensitiveFactors ?? [])},
      ${toJson(project.profile ?? null)}, ${project.createdAt ?? new Date().toISOString()}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      borough = EXCLUDED.borough,
      project_type = EXCLUDED.project_type,
      use = EXCLUDED.use,
      height = EXCLUDED.height,
      units = EXCLUDED.units,
      permit_stage = EXCLUDED.permit_stage,
      sensitive_factors = EXCLUDED.sensitive_factors,
      profile = EXCLUDED.profile
  `;
}

export async function listProjects(): Promise<Project[]> {
  const rows = await sql<ProjectRow[]>`
    SELECT * FROM projects ORDER BY created_at DESC
  `;

  return rows.map(rowToProject);
}

export async function getProject(projectId: string): Promise<Project | null> {
  const rows = await sql<ProjectRow[]>`
    SELECT * FROM projects WHERE id = ${projectId} LIMIT 1
  `;

  return rows[0] ? rowToProject(rows[0]) : null;
}

export async function insertDocument(document: ProjectDocument) {
  await sql`
    INSERT INTO documents (
      id, project_id, file_name, type, summary, tags, text, structured, created_at
    )
    VALUES (
      ${document.id}, ${document.projectId}, ${document.fileName}, ${document.type},
      ${document.summary ?? null}, ${toJson(document.tags ?? [])},
      ${document.text ?? null}, ${toJson(document.structured ?? null)},
      ${document.createdAt ?? new Date().toISOString()}
    )
    ON CONFLICT (id) DO UPDATE SET
      project_id = EXCLUDED.project_id,
      file_name = EXCLUDED.file_name,
      type = EXCLUDED.type,
      summary = EXCLUDED.summary,
      tags = EXCLUDED.tags,
      text = EXCLUDED.text,
      structured = EXCLUDED.structured
  `;
}

export async function upsertDocumentChunk(chunk: DocumentChunkInput) {
  await sql`
    INSERT INTO document_chunks (
      id, project_id, document_id, file_name, chunk_index, text, embedding,
      clause_id, clause_title, clause_type, page_start, page_end,
      key_obligations, risk_signals, parties, tags, path, created_at
    )
    VALUES (
      ${chunk.id}, ${chunk.projectId}, ${chunk.documentId}, ${chunk.fileName},
      ${chunk.chunkIndex}, ${chunk.text}, ${toVectorLiteral(chunk.embedding)}::vector,
      ${chunk.clauseId ?? null}, ${chunk.clauseTitle ?? null}, ${chunk.clauseType ?? null},
      ${chunk.pageStart ?? null}, ${chunk.pageEnd ?? null},
      ${toJson(chunk.keyObligations ?? [])}, ${toJson(chunk.riskSignals ?? [])},
      ${toJson(chunk.parties ?? [])}, ${toJson(chunk.tags ?? [])},
      ${toJson(chunk.path ?? [])}, ${chunk.createdAt ?? new Date().toISOString()}
    )
    ON CONFLICT (id) DO UPDATE SET
      project_id = EXCLUDED.project_id,
      document_id = EXCLUDED.document_id,
      file_name = EXCLUDED.file_name,
      chunk_index = EXCLUDED.chunk_index,
      text = EXCLUDED.text,
      embedding = EXCLUDED.embedding,
      clause_id = EXCLUDED.clause_id,
      clause_title = EXCLUDED.clause_title,
      clause_type = EXCLUDED.clause_type,
      page_start = EXCLUDED.page_start,
      page_end = EXCLUDED.page_end,
      key_obligations = EXCLUDED.key_obligations,
      risk_signals = EXCLUDED.risk_signals,
      parties = EXCLUDED.parties,
      tags = EXCLUDED.tags,
      path = EXCLUDED.path
  `;
}

export async function upsertLaw(law: LawUpdate) {
  await sql`
    INSERT INTO laws (
      id, seed_id, title, source, source_url, jurisdiction, category, urgency,
      old_text, new_text, summary, risk, structured, embedding, created_at
    )
    VALUES (
      ${law.id}, ${law.seedId ?? null}, ${law.title}, ${law.source}, ${law.sourceUrl ?? null},
      ${law.jurisdiction}, ${law.category}, ${law.urgency}, ${law.oldText ?? null},
      ${law.newText}, ${law.summary ?? null}, ${law.risk ?? null},
      ${toJson(law.structured ?? null)}, ${toVectorLiteral(law.embedding ?? [])}::vector,
      ${law.createdAt ?? new Date().toISOString()}
    )
    ON CONFLICT (id) DO UPDATE SET
      seed_id = EXCLUDED.seed_id,
      title = EXCLUDED.title,
      source = EXCLUDED.source,
      source_url = EXCLUDED.source_url,
      jurisdiction = EXCLUDED.jurisdiction,
      category = EXCLUDED.category,
      urgency = EXCLUDED.urgency,
      old_text = EXCLUDED.old_text,
      new_text = EXCLUDED.new_text,
      summary = EXCLUDED.summary,
      risk = EXCLUDED.risk,
      structured = EXCLUDED.structured,
      embedding = EXCLUDED.embedding
  `;
}

export async function getLaw(lawId: string): Promise<LawUpdate | null> {
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM laws WHERE id = ${lawId} LIMIT 1
  `;

  return rows[0] ? rowToLaw(rows[0]) : null;
}

export async function listLaws(): Promise<LawUpdate[]> {
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM laws ORDER BY created_at DESC
  `;

  return rows.map(rowToLaw);
}

export async function listRelevantChunksByVector({
  projectId,
  embedding,
  limit,
}: {
  projectId: string;
  embedding: number[];
  limit: number;
}): Promise<ScoredDocumentChunk[]> {
  const rows = await sql<Record<string, unknown>[]>`
    SELECT
      id, project_id, document_id, file_name, chunk_index, text,
      embedding::text AS embedding, clause_id, clause_title, clause_type,
      page_start, page_end, key_obligations, risk_signals, parties, tags, path,
      created_at, embedding <=> ${toVectorLiteral(embedding)}::vector AS vector_score
    FROM document_chunks
    WHERE project_id = ${projectId}
    ORDER BY embedding <=> ${toVectorLiteral(embedding)}::vector
    LIMIT ${limit}
  `;

  return rows.map(rowToChunk);
}

export async function upsertNotification(notification: ImpactNotification) {
  await sql`
    INSERT INTO notifications (
      id, project_id, law_id, title, message, urgency,
      affected_documents, created_at, read
    )
    VALUES (
      ${notification.id}, ${notification.projectId}, ${notification.lawId},
      ${notification.title}, ${notification.message}, ${notification.urgency},
      ${toJson(notification.affectedDocuments)},
      ${notification.createdAt}, ${notification.read}
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      urgency = EXCLUDED.urgency,
      affected_documents = EXCLUDED.affected_documents,
      created_at = EXCLUDED.created_at,
      read = EXCLUDED.read
  `;
}

export async function listNotifications(projectId?: string): Promise<ImpactNotification[]> {
  const rows = projectId
    ? await sql<Record<string, unknown>[]>`
        SELECT * FROM notifications
        WHERE project_id = ${projectId}
        ORDER BY created_at DESC
      `
    : await sql<Record<string, unknown>[]>`
        SELECT * FROM notifications
        ORDER BY created_at DESC
      `;

  return rows.map(rowToNotification);
}
