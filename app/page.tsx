"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/permit-radar/header";
import { Dashboard } from "@/components/permit-radar/dashboard";
import { Hero, type AttachedFile } from "@/components/permit-radar/hero";
import {
  deriveProjectName,
  loadProjects,
  newProjectId,
  saveProjects,
  type SavedFile,
  type SavedProject,
  type SavedProjectSnapshot,
} from "@/lib/projects";
import {
  deleteFilesByPrefix,
  fileKey,
  storeFile,
} from "@/lib/file-storage";
import type { ImpactNotification } from "@/lib/rag/types";

type Stage = "idle" | "analyzing" | "ready";

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [notifications, setNotifications] = useState<ImpactNotification[]>([]);

  useEffect(() => {
    const stored = loadProjects();
    if (stored.length === 0) return;
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage hydration must run after mount */
    setProjects(stored);
    setActiveId(stored[0].id);
    setStage("ready");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persist = (next: SavedProject[]) => {
    setProjects(next);
    saveProjects(next);
  };

  const analyze = async ({
    description,
    files,
  }: {
    description: string;
    files: AttachedFile[];
  }) => {
    const projectId = newProjectId();

    setPendingPrompt(description);
    setStage("analyzing");
    setError(null);

    try {
      let res: Response;
      if (files.length > 0) {
        const formData = new FormData();
        formData.append("description", description);
        formData.append("projectId", projectId);
        for (const f of files) {
          formData.append("files", f.file, f.file.name);
        }
        res = await fetch("/api/analyze", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, projectId }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Error ${res.status}`);
      }

      const snapshot = data as SavedProjectSnapshot;

      const savedFiles: SavedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const key = fileKey(projectId, i);
        try {
          await storeFile(key, f.file);
          savedFiles.push({
            key,
            name: f.file.name,
            type: f.file.type || "application/octet-stream",
            size: f.file.size,
          });
        } catch (e) {
          console.warn("Failed to store file", f.file.name, e);
        }
      }

      const project: SavedProject = {
        id: projectId,
        name: deriveProjectName(snapshot),
        prompt: description,
        createdAt: Date.now(),
        snapshot,
        files: savedFiles,
      };
      const next = [project, ...projects];
      persist(next);
      setActiveId(project.id);
      setStage("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStage("idle");
    }
  };

  const startNewProject = () => {
    setStage("idle");
    setActiveId(null);
    setPendingPrompt("");
    setError(null);
  };

  const selectProject = (id: string) => {
    if (!projects.some((p) => p.id === id)) return;
    setActiveId(id);
    setStage("ready");
    setError(null);
  };

  const deleteProject = (id: string) => {
    const next = projects.filter((p) => p.id !== id);
    persist(next);
    void deleteFilesByPrefix(`${id}::`);
    if (activeId === id) {
      if (next.length > 0) {
        setActiveId(next[0].id);
        setStage("ready");
      } else {
        setActiveId(null);
        setStage("idle");
      }
    }
  };

  const renameProject = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist(projects.map((p) => (p.id === id ? { ...p, name: trimmed } : p)));
  };

  const activeProject = projects.find((p) => p.id === activeId) ?? null;
  const activeProjectFileKey = activeProject
    ? [
        ...(activeProject.files?.map((file) => file.name) ?? []),
        ...(activeProject.snapshot.attachedFilesProcessed?.map(
          (file) => file.filename,
        ) ?? []),
      ]
        .map((name) => name.trim().toLowerCase())
        .sort()
        .join("|")
    : "";
  const notificationScope = `${activeId ?? ""}:${activeProjectFileKey}`;

  useEffect(() => {
    if (stage !== "ready" || !activeId || !activeProject) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    const projectFileNames = new Set(
      activeProjectFileKey.split("|").filter(Boolean),
    );

    function matchesProjectFiles(notification: ImpactNotification) {
      if (projectFileNames.size === 0) {
        return false;
      }

      return notification.affectedDocuments.some((document) =>
        projectFileNames.has(document.fileName.trim().toLowerCase()),
      );
    }

    async function loadNotifications() {
      try {
        const res = await fetch(
          `/api/notifications?projectId=${encodeURIComponent(activeId ?? "")}`,
        );
        const data = await res.json();
        let nextNotifications: ImpactNotification[] =
          res.ok && Array.isArray(data.notifications) ? data.notifications : [];

        if (nextNotifications.length === 0 && projectFileNames.size > 0) {
          const fallbackRes = await fetch("/api/notifications");
          const fallbackData = await fallbackRes.json();
          const allNotifications: ImpactNotification[] =
            fallbackRes.ok && Array.isArray(fallbackData.notifications)
              ? fallbackData.notifications
              : [];

          nextNotifications = allNotifications.filter(matchesProjectFiles);
        }

        if (!cancelled) {
          setNotifications(nextNotifications);
        }
      } catch (error) {
        console.warn("Failed to load notifications", error);
      }
    }

    void loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [notificationScope, stage]);

  return (
    <>
      <AppHeader
        onReset={startNewProject}
        showReset={stage === "ready" && activeProject !== null}
      />
      <main className="flex flex-1 flex-col">
        {stage === "ready" && activeProject ? (
          <Dashboard
            snapshot={activeProject.snapshot}
            notifications={notifications}
            prompt={activeProject.prompt}
            projects={projects}
            activeId={activeProject.id}
            onSelectProject={selectProject}
            onNewProject={startNewProject}
            onDeleteProject={deleteProject}
            onRenameProject={renameProject}
          />
        ) : (
          <Hero
            onAnalyze={analyze}
            isAnalyzing={stage === "analyzing"}
            errorMessage={error}
            pendingPrompt={pendingPrompt}
            savedProjects={projects}
            onOpenProject={selectProject}
          />
        )}
      </main>
      <footer className="border-t border-border py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <span>© Permit Radar AI · BCF Hackathon prototype</span>
          <span>AI-generated legal information — not legal advice.</span>
        </div>
      </footer>
    </>
  );
}
