import { db } from "@/lib/firebase-admin";
import { generateEmbedding } from "@/lib/embeddings";
import type {
  DocumentChunk,
  FindRelevantChunksForLawInput,
  ScoredDocumentChunk,
} from "@/lib/rag/types";

const DEFAULT_TOP_K = 8;

export function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);

  if (length === 0) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] || 0;
    const rightValue = right[index] || 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function normalizeEmbedding(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is number => typeof entry === "number");
  }

  if (value && typeof value === "object") {
    const vector = value as {
      toArray?: () => number[];
      values?: number[];
      _values?: number[];
    };

    if (typeof vector.toArray === "function") {
      return vector.toArray();
    }

    if (Array.isArray(vector.values)) {
      return vector.values;
    }

    if (Array.isArray(vector._values)) {
      return vector._values;
    }
  }

  return [];
}

function docToChunk(doc: FirebaseFirestore.QueryDocumentSnapshot): DocumentChunk {
  const data = doc.data();

  return {
    id: doc.id,
    projectId: String(data.projectId || ""),
    documentId: String(data.documentId || ""),
    fileName: String(data.fileName || ""),
    chunkIndex: Number(data.chunkIndex || 0),
    text: String(data.text || ""),
    embedding: normalizeEmbedding(data.embedding),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
  };
}

async function tryFirestoreVectorSearch({
  projectId,
  lawEmbedding,
  topK,
}: {
  projectId: string;
  lawEmbedding: number[];
  topK: number;
}): Promise<ScoredDocumentChunk[] | null> {
  const collection = db.collection("documentChunks") as unknown as {
    where: (...args: unknown[]) => unknown;
  };
  const filteredQuery = collection.where("projectId", "==", projectId) as {
    findNearest?: (options: {
      vectorField: string;
      queryVector: number[];
      limit: number;
      distanceMeasure: "COSINE";
      distanceResultField?: string;
    }) => { get: () => Promise<FirebaseFirestore.QuerySnapshot> };
  };

  if (typeof filteredQuery.findNearest !== "function") {
    return null;
  }

  try {
    const snapshot = await filteredQuery
      .findNearest({
        vectorField: "embedding",
        queryVector: lawEmbedding,
        limit: topK,
        distanceMeasure: "COSINE",
        distanceResultField: "vectorDistance",
      })
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const chunk = docToChunk(doc);
      const distance = typeof data.vectorDistance === "number" ? data.vectorDistance : undefined;

      return {
        ...chunk,
        score: typeof distance === "number" ? 1 - distance : undefined,
      };
    });
  } catch (error) {
    console.warn("Firestore Vector Search failed, using cosine fallback.", error);
    return null;
  }
}

async function fallbackCosineSearch({
  projectId,
  lawEmbedding,
  topK,
}: {
  projectId: string;
  lawEmbedding: number[];
  topK: number;
}): Promise<ScoredDocumentChunk[]> {
  const snapshot = await db
    .collection("documentChunks")
    .where("projectId", "==", projectId)
    .get();

  return snapshot.docs
    .map((doc) => {
      const chunk = docToChunk(doc);

      return {
        ...chunk,
        score: cosineSimilarity(lawEmbedding, chunk.embedding),
      };
    })
    .sort((left, right) => (right.score || 0) - (left.score || 0))
    .slice(0, topK);
}

export async function findRelevantChunksForLaw({
  projectId,
  lawText,
  topK = DEFAULT_TOP_K,
}: FindRelevantChunksForLawInput): Promise<ScoredDocumentChunk[]> {
  const lawEmbedding = await generateEmbedding(lawText);
  const limit = Math.max(1, topK);

  // Use native Firestore Vector Search when the SDK and index are available.
  const vectorSearchResults = await tryFirestoreVectorSearch({
    projectId,
    lawEmbedding,
    topK: limit,
  });

  if (vectorSearchResults) {
    return vectorSearchResults;
  }

  // Hackathon fallback: keeps local demos working without a vector index.
  return fallbackCosineSearch({
    projectId,
    lawEmbedding,
    topK: limit,
  });
}
