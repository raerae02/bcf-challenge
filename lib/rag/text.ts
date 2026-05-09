const DEFAULT_MAX_CHARS = 1000;
const DEFAULT_OVERLAP_CHARS = 150;

export function chunkText(text: string, maxChars = DEFAULT_MAX_CHARS): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const overlap = Math.min(DEFAULT_OVERLAP_CHARS, Math.max(0, maxChars - 1));
  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const hardEnd = Math.min(start + maxChars, normalized.length);
    let end = hardEnd;

    // Prefer ending at a natural boundary when one exists near the limit.
    const boundaryWindowStart = Math.max(start + Math.floor(maxChars * 0.7), start);
    const boundaryCandidates = [
      normalized.lastIndexOf(". ", hardEnd),
      normalized.lastIndexOf("\n", hardEnd),
      normalized.lastIndexOf(" ", hardEnd),
    ].filter((index) => index >= boundaryWindowStart);

    if (boundaryCandidates.length > 0 && hardEnd < normalized.length) {
      end = Math.max(...boundaryCandidates) + 1;
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}

export function buildLawText(law: {
  title?: string;
  category?: string;
  jurisdiction?: string;
  oldText?: string;
  newText?: string;
  summary?: string;
  risk?: string;
}): string {
  return [
    law.title,
    law.category,
    law.jurisdiction,
    law.oldText,
    law.newText,
    law.summary,
    law.risk,
  ]
    .filter(Boolean)
    .join("\n\n");
}
