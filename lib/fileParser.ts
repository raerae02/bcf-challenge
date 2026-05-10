export type ProcessedFile = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  inlineText: string | null;
};

async function getPdfWorkerUrl() {
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");

  return pathToFileURL(
    path.join(
      process.cwd(),
      "node_modules",
      "pdf-parse",
      "dist",
      "pdf-parse",
      "esm",
      "pdf.worker.mjs",
    ),
  ).href;
}

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
    const { PDFParse } = await import("pdf-parse");
    PDFParse.setWorker(await getPdfWorkerUrl());
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();

      return {
        filename,
        mimeType: "application/pdf",
        buffer,
        inlineText: result.text.trim() || null,
      };
    } finally {
      await parser.destroy();
    }
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
