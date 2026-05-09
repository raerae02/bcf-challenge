import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { analyzeAffectedSubclausesWithGemini } from "@/lib/rag/impact";
import { buildStructuredLawEmbeddingText, fallbackStructuredLaw } from "@/lib/rag/laws";
import { findRelevantChunksForLaw } from "@/lib/rag/sources";
import type { ImpactScanDraft, LawUpdate, Project } from "@/lib/rag/types";

function parseImpactRequest(value: unknown) {
  const body = value as { projectId?: unknown; lawId?: unknown; topK?: unknown };

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    throw new Error("projectId is required.");
  }

  if (typeof body.lawId !== "string" || !body.lawId.trim()) {
    throw new Error("lawId is required.");
  }

  return {
    projectId: body.projectId.trim(),
    lawId: body.lawId.trim(),
    topK:
      typeof body.topK === "number" && Number.isFinite(body.topK)
        ? Math.max(1, Math.min(25, Math.floor(body.topK)))
        : 8,
  };
}

async function loadProject(projectId: string): Promise<Project | null> {
  const snapshot = await db.collection("projects").doc(projectId).get();
  return snapshot.exists
    ? ({ id: snapshot.id, ...snapshot.data() } as Project)
    : null;
}

async function loadLaw(lawId: string): Promise<LawUpdate | null> {
  const snapshot = await db.collection("laws").doc(lawId).get();
  return snapshot.exists
    ? ({ id: snapshot.id, ...snapshot.data() } as LawUpdate)
    : null;
}

function lawTextForSearch(law: LawUpdate) {
  const structured =
    law.structured ??
    fallbackStructuredLaw({
      title: law.title,
      source: law.source,
      jurisdiction: law.jurisdiction,
      category: law.category,
      urgency: law.urgency,
      oldText: law.oldText,
      newText: law.newText,
      summary: law.summary,
      risk: law.risk,
    });

  return buildStructuredLawEmbeddingText(structured);
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, lawId, topK } = parseImpactRequest(await req.json());
    const [project, law] = await Promise.all([
      loadProject(projectId),
      loadLaw(lawId),
    ]);

    if (!project) {
      return NextResponse.json({ error: `Project not found: ${projectId}` }, { status: 404 });
    }

    if (!law) {
      return NextResponse.json({ error: `Law not found: ${lawId}` }, { status: 404 });
    }

    const retrievedSubclauses = await findRelevantChunksForLaw({
      projectId,
      lawText: lawTextForSearch(law),
      topK,
    });
    const impact = await analyzeAffectedSubclausesWithGemini({
      project,
      law,
      chunks: retrievedSubclauses,
    });
    const response: ImpactScanDraft = {
      projectId,
      lawId,
      retrievedSubclauses,
      affectedDocuments: impact.affectedDocuments,
      notificationDraft: impact.notificationDraft,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run impact scan." },
      { status: 400 },
    );
  }
}
