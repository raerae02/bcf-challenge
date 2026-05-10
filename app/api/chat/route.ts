import { NextResponse } from "next/server";
import { answerRegulatoryChat } from "@/lib/rag/chat";
import type { ProjectProfile } from "@/lib/types";

function isProjectProfile(value: unknown): value is ProjectProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<ProjectProfile>;

  return (
    typeof profile.businessType === "string" &&
    Array.isArray(profile.activities) &&
    typeof profile.location === "object" &&
    profile.location !== null
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: unknown;
      projectId?: unknown;
      profile?: unknown;
      projectProfile?: unknown;
    };

    const question =
      typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json(
        { error: "question is required." },
        { status: 400 },
      );
    }

    const profileCandidate = body.profile ?? body.projectProfile;
    const profile = isProjectProfile(profileCandidate)
      ? profileCandidate
      : undefined;
    const projectId =
      typeof body.projectId === "string" && body.projectId.trim()
        ? body.projectId.trim()
        : undefined;

    const answer = await answerRegulatoryChat({
      question,
      projectId,
      profile,
    });

    return NextResponse.json(answer);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to answer chat question.",
      },
      { status: 500 },
    );
  }
}
