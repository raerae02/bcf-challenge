import { NextRequest, NextResponse } from "next/server";
import { listNotifications } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId")?.trim();
    const notifications = await listNotifications(projectId);

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list notifications." },
      { status: 500 },
    );
  }
}
