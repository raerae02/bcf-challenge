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
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  fileName: string;
  type: string;
  summary?: string;
  tags?: string[];
  text?: string;
  createdAt?: string;
};

export type DocumentChunk = {
  id: string;
  projectId: string;
  documentId: string;
  fileName: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
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
    impactLevel: ImpactUrgency;
    reason: string;
    recommendedAction: string;
    matchingChunkIds?: string[];
  }[];
  createdAt: string;
  read: boolean;
};

export type FindRelevantChunksForLawInput = {
  projectId: string;
  lawText: string;
  topK?: number;
};
