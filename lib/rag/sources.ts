import { db } from "@/lib/firebase-admin";
import { generateEmbedding } from "@/lib/embeddings";
import type {
  DocumentChunk,
  FindRelevantChunksForLawInput,
  ScoredDocumentChunk,
} from "@/lib/rag/types";

const DEFAULT_TOP_K = 8;
const VECTOR_SCORE_WEIGHT = 0.6;
const BM25_SCORE_WEIGHT = 0.4;
const BM25_K1 = 1.2;
const BM25_B = 0.75;
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "with",
  "must",
  "shall",
  "that",
  "this",
  "from",
  "into",
  "more",
  "before",
  "after",
  "where",
  "when",
  "their",
  "there",
  "been",
  "being",
  "have",
  "has",
  "was",
  "were",
]);
const CLAUSE_TYPES = new Set(["section", "clause", "subclause", "paragraph", "schedule", "other"]);

function tokenize(text: string) {
  return (
    text
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((token) => token.length > 2 && !STOP_WORDS.has(token)) || []
  );
}

function normalizeCosineScore(score: number) {
  return Math.max(0, Math.min(1, (score + 1) / 2));
}

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
    clauseId: typeof data.clauseId === "string" ? data.clauseId : undefined,
    clauseTitle: typeof data.clauseTitle === "string" ? data.clauseTitle : undefined,
    clauseType:
      typeof data.clauseType === "string" && CLAUSE_TYPES.has(data.clauseType)
        ? data.clauseType as DocumentChunk["clauseType"]
        : undefined,
    pageStart: typeof data.pageStart === "number" ? data.pageStart : null,
    pageEnd: typeof data.pageEnd === "number" ? data.pageEnd : null,
    keyObligations: Array.isArray(data.keyObligations) ? data.keyObligations : undefined,
    riskSignals: Array.isArray(data.riskSignals) ? data.riskSignals : undefined,
    parties: Array.isArray(data.parties) ? data.parties : undefined,
    tags: Array.isArray(data.tags) ? data.tags : undefined,
    path: Array.isArray(data.path) ? data.path : undefined,
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
      const vectorScore = typeof distance === "number" ? normalizeCosineScore(1 - distance) : undefined;

      return {
        ...chunk,
        vectorScore,
        score: vectorScore,
      };
    });
  } catch (error) {
    console.warn("Firestore Vector Search failed, using hybrid local fallback.", error);
    return null;
  }
}

function calculateBm25Scores(query: string, chunks: DocumentChunk[]) {
  const queryTerms = Array.from(new Set(tokenize(query)));
  const tokenizedChunks = chunks.map((chunk) => tokenize(chunk.text));
  const averageDocumentLength =
    tokenizedChunks.reduce((sum, tokens) => sum + tokens.length, 0) /
    Math.max(tokenizedChunks.length, 1);
  const documentFrequencies = new Map<string, number>();

  for (const tokens of tokenizedChunks) {
    const uniqueTerms = new Set(tokens);

    for (const term of queryTerms) {
      if (uniqueTerms.has(term)) {
        documentFrequencies.set(term, (documentFrequencies.get(term) || 0) + 1);
      }
    }
  }

  return chunks.map((_, chunkIndex) => {
    const tokens = tokenizedChunks[chunkIndex];
    const termFrequencies = new Map<string, number>();

    for (const token of tokens) {
      termFrequencies.set(token, (termFrequencies.get(token) || 0) + 1);
    }

    return queryTerms.reduce((score, term) => {
      const termFrequency = termFrequencies.get(term) || 0;

      if (!termFrequency) {
        return score;
      }

      const documentFrequency = documentFrequencies.get(term) || 0;
      const inverseDocumentFrequency = Math.log(
        1 + (chunks.length - documentFrequency + 0.5) / (documentFrequency + 0.5),
      );
      const lengthNormalization =
        1 - BM25_B + BM25_B * (tokens.length / Math.max(averageDocumentLength, 1));
      const weightedFrequency =
        (termFrequency * (BM25_K1 + 1)) / (termFrequency + BM25_K1 * lengthNormalization);

      return score + inverseDocumentFrequency * weightedFrequency;
    }, 0);
  });
}

function normalizeScores(scores: number[]) {
  const maxScore = Math.max(...scores, 0);

  if (maxScore <= 0) {
    return scores.map(() => 0);
  }

  return scores.map((score) => score / maxScore);
}

function rerankWithHybridScore({
  chunks,
  lawText,
  lawEmbedding,
  topK,
}: {
  chunks: ScoredDocumentChunk[];
  lawText: string;
  lawEmbedding: number[];
  topK: number;
}): Promise<ScoredDocumentChunk[]> {
  const vectorScores = chunks.map(
    (chunk) => chunk.vectorScore ?? normalizeCosineScore(cosineSimilarity(lawEmbedding, chunk.embedding)),
  );
  const bm25Scores = calculateBm25Scores(lawText, chunks);
  const normalizedBm25Scores = normalizeScores(bm25Scores);

  return Promise.resolve(
    chunks
      .map((chunk, index) => ({
        ...chunk,
        vectorScore: vectorScores[index],
        bm25Score: normalizedBm25Scores[index],
        score:
          VECTOR_SCORE_WEIGHT * vectorScores[index] +
          BM25_SCORE_WEIGHT * normalizedBm25Scores[index],
      }))
      .sort((left, right) => (right.score || 0) - (left.score || 0))
      .slice(0, topK),
  );
}

async function fallbackHybridSearch({
  projectId,
  lawText,
  lawEmbedding,
  topK,
}: {
  projectId: string;
  lawText: string;
  lawEmbedding: number[];
  topK: number;
}): Promise<ScoredDocumentChunk[]> {
  const snapshot = await db
    .collection("documentChunks")
    .where("projectId", "==", projectId)
    .get();
  const chunks = snapshot.docs.map((doc) => docToChunk(doc));

  return rerankWithHybridScore({
    chunks,
    lawText,
    lawEmbedding,
    topK,
  });
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
    topK: limit * 3,
  });

  if (vectorSearchResults) {
    return rerankWithHybridScore({
      chunks: vectorSearchResults,
      lawText,
      lawEmbedding,
      topK: limit,
    });
  }

  // Hackathon fallback: combines semantic and exact-term relevance without a vector index.
  return fallbackHybridSearch({
    projectId,
    lawText,
    lawEmbedding,
    topK: limit,
  });
}
