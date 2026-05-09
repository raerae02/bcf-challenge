import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import type { ImpactNotification } from "@/lib/rag/types";

function toNotification(doc: FirebaseFirestore.QueryDocumentSnapshot): ImpactNotification {
  return {
    id: doc.id,
    ...(doc.data() as Omit<ImpactNotification, "id">),
  };
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId")?.trim();
    const query = projectId
      ? db.collection("notifications").where("projectId", "==", projectId)
      : db.collection("notifications");
    const snapshot = await query.get();
    const notifications = snapshot.docs
      .map(toNotification)
      .sort((left, right) => {
        const leftTime = Date.parse(left.createdAt || "");
        const rightTime = Date.parse(right.createdAt || "");

        return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
      });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list notifications." },
      { status: 500 },
    );
  }
}
