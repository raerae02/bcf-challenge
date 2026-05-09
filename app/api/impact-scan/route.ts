import { NextRequest, NextResponse } from "next/server";
import { runImpactScanForProject } from "@/lib/rag/monitoring";

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

export async function POST(req: NextRequest) {
  try {
    const { projectId, lawId, topK } = parseImpactRequest(await req.json());
    const response = await runImpactScanForProject({
      projectId,
      lawId,
      topK,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run impact scan.";
    const status = message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
