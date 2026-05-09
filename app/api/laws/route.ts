import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { createStructuredLaw, type RawLawInput } from "@/lib/rag/laws";
import type { ImpactUrgency, LawUpdate } from "@/lib/rag/types";

const VALID_URGENCY = new Set(["Low", "Medium", "High", "Critical"]);

function parseLawInput(value: unknown): RawLawInput {
  const body = value as Partial<RawLawInput>;

  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object.");
  }

  for (const field of ["title", "source", "jurisdiction", "category", "newText"] as const) {
    if (typeof body[field] !== "string" || !body[field]?.trim()) {
      throw new Error(`Missing required law field: ${field}`);
    }
  }

  if (typeof body.urgency !== "string" || !VALID_URGENCY.has(body.urgency)) {
    throw new Error("urgency must be one of Low, Medium, High, Critical.");
  }

  return {
    title: String(body.title).trim(),
    source: String(body.source).trim(),
    jurisdiction: String(body.jurisdiction).trim(),
    category: String(body.category).trim(),
    urgency: body.urgency as ImpactUrgency,
    oldText: body.oldText,
    newText: String(body.newText).trim(),
    summary: body.summary,
    risk: body.risk,
  };
}

export async function POST(req: NextRequest) {
  try {
    const input = parseLawInput(await req.json());
    const law = await createStructuredLaw(input);

    return NextResponse.json({ law });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create law." },
      { status: 400 },
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection("laws").orderBy("createdAt", "desc").get();
    const laws: LawUpdate[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<LawUpdate, "id">),
    }));

    return NextResponse.json({ laws });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list laws." },
      { status: 500 },
    );
  }
}
