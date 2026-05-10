const MOCK_EMBEDDING_DIMENSIONS = 768;
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

function shouldUseMockEmbeddings() {
  return process.env.MOCK_EMBEDDINGS === "true" || !process.env.OPENAI_API_KEY;
}

function hashText(text: string) {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed || 1;

  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) / 4294967295) * 2 - 1;
  };
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 2) || [];
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

export function generateMockEmbedding(text: string, dimensions = MOCK_EMBEDDING_DIMENSIONS) {
  const tokens = tokenize(text);
  const vector = Array.from({ length: dimensions }, () => 0);

  for (const token of tokens) {
    vector[hashText(token) % dimensions] += 1;
  }

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const phrase = `${tokens[index]} ${tokens[index + 1]}`;
    vector[hashText(phrase) % dimensions] += 1.5;
  }

  if (tokens.length === 0) {
    const random = seededRandom(hashText(text));
    return normalizeVector(Array.from({ length: dimensions }, () => random()));
  }

  return normalizeVector(vector);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.trim();

  if (!input) {
    return generateMockEmbedding("");
  }

  if (shouldUseMockEmbeddings()) {
    return generateMockEmbedding(input);
  }

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
      input,
      dimensions: MOCK_EMBEDDING_DIMENSIONS,
    });
    const embedding = response.data[0]?.embedding ?? [];

    if (embedding.length > 0) {
      return embedding;
    }
  } catch (error) {
    console.warn("Embedding provider failed, using deterministic mock embedding.", error);
  }

  return generateMockEmbedding(input);
}
