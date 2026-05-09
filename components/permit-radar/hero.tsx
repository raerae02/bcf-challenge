"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  FolderKanban,
  Loader2,
  MapPin,
  Paperclip,
  Radar,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { SavedProject } from "@/lib/projects";
import { cn } from "@/lib/utils";

const SAMPLE_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: "Bakery · Plateau-Mont-Royal",
    prompt:
      "I want to open a small bakery on Saint-Denis Street in Plateau-Mont-Royal. About 800 sq ft, with a small terrace and 4 employees.",
  },
  {
    label: "Medical clinic · NDG",
    prompt:
      "I want to open a medical clinic in NDG with 3 examination rooms and an X-ray machine.",
  },
  {
    label: "Café with alcohol · Mile End",
    prompt:
      "I want to renovate a commercial space in Mile End to open a café with alcohol service.",
  },
];

const ACCEPTED_TYPES = ".pdf,.docx,.txt,.md";
const MAX_FILE_SIZE_MB = 10;
const MIN_DESCRIPTION_LEN = 20;

export type AttachedFile = { file: File; id: string };

type HeroProps = {
  onAnalyze: (input: { description: string; files: AttachedFile[] }) => void;
  isAnalyzing: boolean;
  errorMessage?: string | null;
  pendingPrompt?: string;
  savedProjects?: SavedProject[];
  onOpenProject?: (id: string) => void;
};

export function Hero({
  onAnalyze,
  isAnalyzing,
  errorMessage,
  pendingPrompt,
  savedProjects = [],
  onOpenProject,
}: HeroProps) {
  const [description, setDescription] = useState(pendingPrompt ?? "");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    !isAnalyzing &&
    (description.trim().length >= MIN_DESCRIPTION_LEN || files.length > 0);

  const addFiles = (incoming: FileList | File[]) => {
    setLocalError(null);
    const next: AttachedFile[] = [];
    for (const file of Array.from(incoming)) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setLocalError(
          `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit.`,
        );
        continue;
      }
      next.push({ file, id: crypto.randomUUID() });
    }
    if (next.length) setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const submit = () => {
    if (!canSubmit) return;
    onAnalyze({ description: description.trim(), files });
  };

  const applySample = (sample: string) => {
    setDescription(sample);
    onAnalyze({ description: sample, files: [] });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.55_0.18_255_/_0.18),transparent_60%)]" />
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pt-16 pb-10 text-center sm:pt-24">
        <Badge variant="outline" className="mb-5 gap-1.5">
          <Sparkles className="size-3" />
          BCF Track #1 — Just-in-time legal intelligence
        </Badge>
        <h1 className="font-heading max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          From your business idea to a{" "}
          <span className="bg-gradient-to-br from-brand to-foreground bg-clip-text text-transparent">
            complete regulatory map
          </span>{" "}
          in seconds.
        </h1>
        <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Describe your construction or business project, or upload your
          documents (lease, business plan, quote). Regulation Radar AI surfaces
          required permits, applicable regulations, and recent changes — with a
          risk score and concrete actions.
        </p>

        <div className="mt-10 w-full max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-1.5 shadow-sm ring-1 ring-foreground/5">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="e.g. I want to open a 800 sq ft bakery on Saint-Denis Street in Plateau-Mont-Royal, with 4 employees and a 6-seat terrace."
              className="min-h-[120px] resize-none border-0 bg-transparent px-4 py-3 text-base shadow-none focus-visible:ring-0"
              disabled={isAnalyzing}
            />

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                if (event.dataTransfer.files.length > 0) {
                  addFiles(event.dataTransfer.files);
                }
              }}
              className={cn(
                "mx-2 mb-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 text-left transition-colors",
                dragOver
                  ? "border-brand bg-brand/5"
                  : "border-border bg-muted/30 hover:bg-muted/60",
                isAnalyzing && "pointer-events-none opacity-50",
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-foreground/10">
                <UploadCloud className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground">
                  Drag and drop documents or{" "}
                  <span className="text-brand">click to browse</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  PDF, DOCX, TXT, MD · max {MAX_FILE_SIZE_MB} MB · ideal for
                  leases, business plans, quotes
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>

            {files.length > 0 ? (
              <ul className="mx-2 mb-2 space-y-1.5">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs"
                  >
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{f.file.name}</span>
                    <span className="text-muted-foreground">
                      ({(f.file.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeFile(f.id);
                      }}
                      className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-background hover:text-destructive"
                      aria-label={`Remove ${f.file.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex items-center justify-between gap-2 px-2 pb-1.5 pt-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                Coverage: Quebec · Montreal and boroughs
              </span>
              <div className="flex items-center gap-2">
                {files.length > 0 ? (
                  <Badge variant="secondary" className="gap-1">
                    <Paperclip className="size-3" />
                    {files.length} file{files.length > 1 ? "s" : ""}
                  </Badge>
                ) : null}
                <Button onClick={submit} disabled={!canSubmit} size="lg">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze project
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {localError || errorMessage ? (
            <p className="mt-3 text-left text-xs font-medium text-destructive">
              {localError ?? errorMessage}
            </p>
          ) : null}

          {savedProjects.length > 0 && onOpenProject ? (
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <FolderKanban className="size-3.5" />
                Your projects
              </span>
              {savedProjects.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => onOpenProject(p.id)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-brand/50 hover:text-foreground disabled:opacity-50"
                >
                  <span className="size-1.5 rounded-full bg-brand" />
                  <span className="max-w-[180px] truncate">{p.name}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Examples
            </span>
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                disabled={isAnalyzing}
                onClick={() => applySample(sample.prompt)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-brand/50 hover:text-foreground disabled:opacity-50"
              >
                <Radar className="size-3 text-brand" />
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <FeatureGrid />
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features = [
    {
      title: "Project profile",
      desc: "Automatic extraction of activity type, location, and constraints — including from your documents.",
    },
    {
      title: "Regulatory snapshot",
      desc: "Every applicable permit and regulation, ranked by risk.",
    },
    {
      title: "Delta alerts",
      desc: "Recent changes with their specific impact on your project.",
    },
    {
      title: "Risk report",
      desc: "Executive summary and recommended actions ready to present.",
    },
  ];
  return (
    <div className="mt-16 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((f) => (
        <div
          key={f.title}
          className="rounded-xl border border-border bg-card/50 p-4 text-left ring-1 ring-foreground/5"
        >
          <div className="font-heading text-sm font-medium">{f.title}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {f.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
