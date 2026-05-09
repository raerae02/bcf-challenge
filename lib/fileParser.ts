export type ProcessedFile = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  inlineText: string | null;
};

const SUPPORTED_NATIVE_TYPES = ["application/pdf"];

export async function processFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<ProcessedFile> {
  const lowerName = filename.toLowerCase();
  const isPdf = mimeType === "application/pdf" || lowerName.endsWith(".pdf");
  const isText =
    mimeType.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md");

  if (isPdf) {
    // PDF: send raw bytes to Gemini, no extraction
    return {
      filename,
      mimeType: "application/pdf",
      buffer,
      inlineText: null,
    };
  }

  if (isText) {
    // Text: read content directly, include inline in prompt
    return {
      filename,
      mimeType: "text/plain",
      buffer,
      inlineText: buffer.toString("utf-8"),
    };
  }

  throw new Error(`Unsupported file type: ${mimeType || filename}`);
}

export function isNativelySupportedByGemini(mimeType: string): boolean {
  return SUPPORTED_NATIVE_TYPES.includes(mimeType);
}
