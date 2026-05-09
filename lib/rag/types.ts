export type ImpactUrgency = "Low" | "Medium" | "High" | "Critical";

export type Project = {
  id: string;
  name: string;
  location: string;
  borough?: string;
  projectType: string;
  use: string;
  height?: string;
  units?: number;
  permitStage?: string;
  sensitiveFactors?: string[];
  createdAt?: string;
};

export type LawUpdate = {
  id: string;
  title: string;
  source: string;
  jurisdiction: string;
  category: string;
  urgency: ImpactUrgency;
  oldText?: string;
  newText: string;
  summary?: string;
  risk?: string;
  createdAt?: string;
  embedding?: number[];
  structured?: StructuredLawUpdate;
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  fileName: string;
  type: string;
  summary?: string;
  tags?: string[];
  text?: string;
  structured?: StructuredDocument;
  createdAt?: string;
};

export type StructuredClause = {
  id: string;
  title: string;
  type: "section" | "clause" | "subclause" | "paragraph" | "schedule" | "other";
  pageStart: number | null;
  pageEnd: number | null;
  text: string;
  keyObligations: string[];
  riskSignals: string[];
  parties: string[];
  tags: string[];
  children?: StructuredClause[];
};

export type StructuredDocument = {
  filename: string;
  documentType: string;
  title: string;
  summary: string;
  clauses: StructuredClause[];
};

export type StructuredLawUpdate = {
  title: string;
  source: string;
  jurisdiction: string;
  category: string;
  urgency: ImpactUrgency;
  summary: string;
  effectiveChange: string;
  obligations: string[];
  affectedProjectFeatures: string[];
  keywords: string[];
  legalRiskThemes: string[];
  oldText?: string;
  newText: string;
  risk?: string;
};

export type DocumentChunk = {
  id: string;
  projectId: string;
  documentId: string;
  fileName: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  clauseId?: string;
  clauseTitle?: string;
  clauseType?: StructuredClause["type"];
  pageStart?: number | null;
  pageEnd?: number | null;
  keyObligations?: string[];
  riskSignals?: string[];
  parties?: string[];
  tags?: string[];
  path?: string[];
  createdAt?: string;
};

export type ScoredDocumentChunk = DocumentChunk & {
  score?: number;
  vectorScore?: number;
  bm25Score?: number;
};

export type ImpactNotification = {
  id: string;
  projectId: string;
  lawId: string;
  title: string;
  message: string;
  urgency: ImpactUrgency;
  affectedDocuments: {
    documentId: string;
    fileName: string;
    affectedSubclauses: AffectedSubclause[];
  }[];
  createdAt: string;
  read: boolean;
};

export type FindRelevantChunksForLawInput = {
  projectId: string;
  lawText: string;
  topK?: number;
};

export type AffectedSubclause = {
  chunkId: string;
  clauseId: string;
  clauseTitle: string;
  pageStart: number | null;
  pageEnd: number | null;
  impactLevel: ImpactUrgency;
  reason: string;
  recommendedAction: string;
};

export type ImpactScanDraft = {
  projectId: string;
  lawId: string;
  retrievedSubclauses: ScoredDocumentChunk[];
  affectedDocuments: {
    documentId: string;
    fileName: string;
    affectedSubclauses: AffectedSubclause[];
  }[];
  notificationDraft: {
    title: string;
    message: string;
    urgency: ImpactUrgency;
  };
};
