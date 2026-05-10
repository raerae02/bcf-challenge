import { listRelevantChunksByVector } from "@/lib/db";
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

async function vectorSearchWithHybridRerank({
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
  const chunks = await listRelevantChunksByVector({
    projectId,
    embedding: lawEmbedding,
    limit: topK * 3,
  });

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

  return vectorSearchWithHybridRerank({
    projectId,
    lawText,
    lawEmbedding,
    topK: limit,
  });
}
