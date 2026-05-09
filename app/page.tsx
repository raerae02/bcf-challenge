"use client";

import { useState } from "react";
import { AppHeader } from "@/components/permit-radar/header";
import { Dashboard } from "@/components/permit-radar/dashboard";
import { Hero, type AttachedFile } from "@/components/permit-radar/hero";
import type { RegulatorySnapshot } from "@/lib/types";

type Stage = "idle" | "analyzing" | "ready";

type AnalyzedSnapshot = RegulatorySnapshot & {
  attachedFilesProcessed?: { filename: string }[];
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [prompt, setPrompt] = useState("");
  const [snapshot, setSnapshot] = useState<AnalyzedSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async ({
    description,
    files,
  }: {
    description: string;
    files: AttachedFile[];
  }) => {
    setPrompt(description);
    setStage("analyzing");
    setError(null);
    setSnapshot(null);

    try {
      let res: Response;
      if (files.length > 0) {
        const formData = new FormData();
        formData.append("description", description);
        for (const f of files) {
          formData.append("files", f.file, f.file.name);
        }
        res = await fetch("/api/analyze", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Error ${res.status}`);
      }
      setSnapshot(data as AnalyzedSnapshot);
      setStage("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStage("idle");
    }
  };

  const reset = () => {
    setStage("idle");
    setPrompt("");
    setSnapshot(null);
    setError(null);
  };

  return (
    <>
      <AppHeader onReset={reset} showReset={stage === "ready"} />
      <main className="flex flex-1 flex-col">
        {stage === "ready" && snapshot ? (
          <Dashboard snapshot={snapshot} prompt={prompt} />
        ) : (
          <Hero
            onAnalyze={analyze}
            isAnalyzing={stage === "analyzing"}
            errorMessage={error}
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
