import { NextResponse } from "next/server";

import { chunkText } from "@/lib/chunking";
import { generateEmbedding } from "@/lib/embeddings";
import { db } from "@/lib/firebase-admin";
import { findRelevantChunksForLaw } from "@/lib/vector-search";

export async function GET() {
  const projectId = "smoke-project";
  const documentId = "smoke-doc";
  const chunkId = "smoke-chunk-1";
  const sourceText =
    "This site plan includes landscaped green space, permeable paving, and a residential permit application for a six-storey building.";
  const lawText =
    "Residential buildings of 4 storeys or more must include landscaped green space before permit approval.";

  try {
    const chunks = chunkText(sourceText);
    const embedding = await generateEmbedding(chunks[0]);

    await db.collection("documentChunks").doc(chunkId).set({
      projectId,
      documentId,
      fileName: "site-plan-notes.txt",
      chunkIndex: 0,
      text: chunks[0],
      embedding,
      createdAt: new Date().toISOString(),
    });

    const results = await findRelevantChunksForLaw({
      projectId,
      lawText,
      topK: 3,
    });

    return NextResponse.json({
      ok: true,
      chunksCreated: chunks.length,
      embeddingLength: embedding.length,
      topResult: results[0]
        ? {
            id: results[0].id,
            fileName: results[0].fileName,
            score: results[0].score,
          }
        : null,
      resultCount: results.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RAG smoke-test error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
