import type { RegulatorySnapshot } from "@/lib/types";

export type SavedProjectSnapshot = RegulatorySnapshot & {
  attachedFilesProcessed?: { filename: string }[];
};

export type SavedFile = {
  key: string;
  name: string;
  type: string;
  size: number;
};

export type SavedProject = {
  id: string;
  name: string;
  prompt: string;
  createdAt: number;
  snapshot: SavedProjectSnapshot;
  files?: SavedFile[];
};

const STORAGE_KEY = "permit-radar:projects";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadProjects(): SavedProject[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveProjects(projects: SavedProject[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deriveProjectName(snapshot: SavedProjectSnapshot): string {
  const profile = snapshot.projectProfile;
  const type = profile.businessType
    ? profile.businessType.charAt(0).toUpperCase() +
      profile.businessType.slice(1)
    : "Project";
  const place = profile.location.borough || profile.location.city;
  return place ? `${type} · ${place}` : type;
}

export function newProjectId(): string {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
