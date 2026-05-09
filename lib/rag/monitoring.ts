import { db } from "@/lib/firebase-admin";
import { analyzeAffectedSubclausesWithGemini } from "@/lib/rag/impact";
import { buildStructuredLawEmbeddingText, fallbackStructuredLaw } from "@/lib/rag/laws";
import { findRelevantChunksForLaw } from "@/lib/rag/sources";
import type {
  ImpactNotification,
  ImpactScanDraft,
  LawUpdate,
  Project,
} from "@/lib/rag/types";

const DEFAULT_TOP_K = 8;

export type MonitoringProjectResult = {
  projectId: string;
  affected: boolean;
  notificationId?: string;
  affectedDocuments?: ImpactScanDraft["affectedDocuments"];
  retrievedSubclausesCount?: number;
  skippedReason?: string;
  error?: string;
};

export type MonitoringSummary = {
  scannedProjects: number;
  affectedProjects: number;
  notificationsCreated: number;
  results: MonitoringProjectResult[];
};

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    ) as T;
  }

  return value;
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

export async function runImpactScanForProject({
  projectId,
  lawId,
  topK = DEFAULT_TOP_K,
  project,
  law,
}: {
  projectId: string;
  lawId: string;
  topK?: number;
  project?: Project;
  law?: LawUpdate;
}): Promise<ImpactScanDraft> {
  const [loadedProject, loadedLaw] = await Promise.all([
    project ? Promise.resolve(project) : loadProject(projectId),
    law ? Promise.resolve(law) : loadLaw(lawId),
  ]);

  if (!loadedProject) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (!loadedLaw) {
    throw new Error(`Law not found: ${lawId}`);
  }

  const retrievedSubclauses = await findRelevantChunksForLaw({
    projectId,
    lawText: lawTextForSearch(loadedLaw),
    topK,
  });
  const impact = await analyzeAffectedSubclausesWithGemini({
    project: loadedProject,
    law: loadedLaw,
    chunks: retrievedSubclauses,
  });

  return {
    projectId,
    lawId,
    retrievedSubclauses,
    affectedDocuments: impact.affectedDocuments,
    notificationDraft: impact.notificationDraft,
  };
}

export async function createImpactNotificationFromScan(
  scan: ImpactScanDraft,
): Promise<ImpactNotification | null> {
  if (scan.affectedDocuments.length === 0) {
    return null;
  }

  const notificationId = `${scan.lawId}_${scan.projectId}`;
  const notification: ImpactNotification = {
    id: notificationId,
    projectId: scan.projectId,
    lawId: scan.lawId,
    title: scan.notificationDraft.title,
    message: scan.notificationDraft.message,
    urgency: scan.notificationDraft.urgency,
    affectedDocuments: scan.affectedDocuments,
    createdAt: new Date().toISOString(),
    read: false,
  };

  await db
    .collection("notifications")
    .doc(notificationId)
    .set(stripUndefined(notification), { merge: true });

  return notification;
}

export async function runMonitoringForLaw({
  law,
  topK = DEFAULT_TOP_K,
}: {
  law: LawUpdate;
  topK?: number;
}): Promise<MonitoringSummary> {
  const projectsSnapshot = await db.collection("projects").get();
  const projects = projectsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Project[];
  const results: MonitoringProjectResult[] = [];
  let affectedProjects = 0;
  let notificationsCreated = 0;

  for (const project of projects) {
    try {
      const scan = await runImpactScanForProject({
        projectId: project.id,
        lawId: law.id,
        topK,
        project,
        law,
      });

      if (scan.retrievedSubclauses.length === 0) {
        results.push({
          projectId: project.id,
          affected: false,
          retrievedSubclausesCount: 0,
          skippedReason: "No document chunks found for this project.",
        });
        continue;
      }

      if (scan.affectedDocuments.length === 0) {
        results.push({
          projectId: project.id,
          affected: false,
          retrievedSubclausesCount: scan.retrievedSubclauses.length,
          skippedReason: "No affected subclauses found.",
        });
        continue;
      }

      const notification = await createImpactNotificationFromScan(scan);
      affectedProjects += 1;

      if (notification) {
        notificationsCreated += 1;
      }

      results.push({
        projectId: project.id,
        affected: true,
        notificationId: notification?.id,
        affectedDocuments: scan.affectedDocuments,
        retrievedSubclausesCount: scan.retrievedSubclauses.length,
      });
    } catch (error) {
      results.push({
        projectId: project.id,
        affected: false,
        error: error instanceof Error ? error.message : "Unable to scan project.",
      });
    }
  }

  return {
    scannedProjects: projects.length,
    affectedProjects,
    notificationsCreated,
    results,
  };
}
