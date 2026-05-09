import { NextResponse } from "next/server";

import { chunkText } from "@/lib/chunking";
import { generateEmbedding } from "@/lib/embeddings";
import { db } from "@/lib/firebase-admin";
import { findRelevantChunksForLaw } from "@/lib/vector-search";

const projectId = "mock-rag-project";

const mockDocuments = [
  {
    documentId: "mock-doc-green-space",
    fileName: "site-plan-green-space.txt",
    type: "Site Plan Notes",
    text: "The site plan describes a six-storey residential building with landscaped green space, a courtyard, permeable paving, tree planting, and permit approval notes for Rosemont.",
  },
  {
    documentId: "mock-doc-fire-safety",
    fileName: "fire-safety-report.txt",
    type: "Fire Safety",
    text: "The fire safety report covers emergency exits, sprinkler coverage, alarm panels, evacuation routes, and inspection requirements for the residential building.",
  },
  {
    documentId: "mock-doc-contract",
    fileName: "contractor-agreement.txt",
    type: "Contract",
    text: "The contractor agreement defines payment milestones, contractor obligations, delay clauses, indemnity language, and dispute resolution terms.",
  },
  {
    documentId: "mock-doc-zoning-height",
    fileName: "zoning-height-review.txt",
    type: "Zoning",
    text: "The zoning review analyzes building height, setbacks, density, lot coverage, municipal approval, and planning constraints for the proposed structure.",
  },
  {
    documentId: "mock-doc-noise",
    fileName: "construction-noise-memo.txt",
    type: "Municipal Memo",
    text: "The municipal memo discusses construction noise limits, work hour restrictions, public notices, complaints, and neighborhood disruption controls.",
  },
];

export async function GET() {
  const targetLawText =
    "Residential projects of 4 storeys or more must include landscaped green space and permeable paving before permit approval.";

  try {
    await Promise.all(
      mockDocuments.map(async (document) => {
        const chunks = chunkText(document.text);

        await db.collection("documents").doc(document.documentId).set({
          id: document.documentId,
          projectId,
          fileName: document.fileName,
          type: document.type,
          text: document.text,
          createdAt: new Date().toISOString(),
        });

        await Promise.all(
          chunks.map(async (chunk, chunkIndex) => {
            const chunkId = `${document.documentId}-chunk-${chunkIndex}`;
            const embedding = await generateEmbedding(chunk);

            await db.collection("documentChunks").doc(chunkId).set({
              id: chunkId,
              projectId,
              documentId: document.documentId,
              fileName: document.fileName,
              chunkIndex,
              text: chunk,
              embedding,
              createdAt: new Date().toISOString(),
            });
          }),
        );
      }),
    );

    const results = await findRelevantChunksForLaw({
      projectId,
      lawText: targetLawText,
      topK: 5,
    });

    return NextResponse.json({
      ok: true,
      expectedTopFile: "site-plan-green-space.txt",
      matchedExpectedTopFile: results[0]?.fileName === "site-plan-green-space.txt",
      query: targetLawText,
      seededDocuments: mockDocuments.map((document) => document.fileName),
      rankedResults: results.map((result) => ({
        id: result.id,
        documentId: result.documentId,
        fileName: result.fileName,
        score: result.score,
        vectorScore: result.vectorScore,
        bm25Score: result.bm25Score,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mock RAG test error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
