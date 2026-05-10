"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileSearch,
  FileText,
  GitCompare,
  Loader2,
  Paperclip,
  Radar,
  Shield,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { SavedProject } from "@/lib/projects";
import { cn } from "@/lib/utils";

const SAMPLE_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: "Bakery · Plateau-Mont-Royal",
    prompt:
      "I want to open a small bakery on Saint-Denis Street in Plateau-Mont-Royal. About 800 sq ft, with a small terrace and 4 employees.",
  },
  {
    label: "Heritage renovation",
    prompt:
      "I am renovating a commercial building near a protected heritage site in Montreal and need to understand permit and heritage risks.",
  },
  {
    label: "Park-adjacent development",
    prompt:
      "I want to develop a small visitor facility near a Quebec park with site work, utilities, and construction access.",
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

  const submit = () => {
    if (!canSubmit) return;
    onAnalyze({ description: description.trim(), files });
  };

  const applySample = (sample: string) => {
    setDescription(sample);
    onAnalyze({ description: sample, files: [] });
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Zap className="size-4" />
              AI-powered compliance monitoring
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Never miss a permit or zoning change again
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              Upload project documents, structure them into clauses, monitor
              legal updates, and get precise notifications when a regulation
              affects your project.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                Start monitoring
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See how it works
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-risk-low-foreground" />
                Local Postgres + pgvector
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-risk-low-foreground" />
                Clause-level impact alerts
              </span>
            </div>
          </div>

          <div className="mx-auto mt-12 w-full max-w-3xl" id="dashboard">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-3">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      (event.metaKey || event.ctrlKey) &&
                      event.key === "Enter"
                    ) {
                      event.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="Describe your project, e.g. heritage renovation near a protected site, park-adjacent development, or commercial permit application..."
                  className="min-h-32 resize-none border-0 bg-transparent px-4 py-3 text-base shadow-none focus-visible:ring-0"
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
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "mx-2 mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-left transition-colors",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:bg-muted/60",
                    isAnalyzing && "pointer-events-none opacity-50",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-border">
                    <UploadCloud className="size-5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      Upload contracts, permits, memos, or site plans
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PDF, DOCX, TXT, MD · max {MAX_FILE_SIZE_MB} MB
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
                        <span className="truncate font-medium">
                          {f.file.name}
                        </span>
                        <span className="text-muted-foreground">
                          ({(f.file.size / 1024).toFixed(0)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setFiles((prev) =>
                              prev.filter((file) => file.id !== f.id),
                            );
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

                <div className="flex flex-col gap-3 px-2 pb-1.5 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {files.length > 0 ? (
                      <Badge variant="secondary" className="gap-1">
                        <Paperclip className="size-3" />
                        {files.length} file{files.length > 1 ? "s" : ""}
                      </Badge>
                    ) : null}
                    {SAMPLE_PROMPTS.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        disabled={isAnalyzing}
                        onClick={() => applySample(sample.prompt)}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
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
              </CardContent>
            </Card>

            {localError || errorMessage ? (
              <p className="mt-3 text-sm font-medium text-destructive">
                {localError ?? errorMessage}
              </p>
            ) : null}

            {savedProjects.length > 0 && onOpenProject ? (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Recent projects
                </span>
                {savedProjects.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => onOpenProject(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="max-w-44 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="features" className="bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Everything you need for compliance
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Purpose-built for construction, real estate, permitting, and
              legal monitoring workflows.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FileSearch className="size-6" />}
              title="Document Analysis"
              description="Upload project documents and extract clauses, obligations, risks, and searchable vectors."
            />
            <FeatureCard
              icon={<Bell className="size-6" />}
              title="Real-Time Alerts"
              description="When laws are added, the backend scans affected documents and creates dashboard notifications."
            />
            <FeatureCard
              icon={<GitCompare className="size-6" />}
              title="Clause Impact"
              description="Impact analysis cites the exact subclause, not only the document."
            />
            <FeatureCard
              icon={<Radar className="size-6" />}
              title="Local Monitoring"
              description="Run the database locally with Postgres and pgvector, no Firestore required."
            />
            <FeatureCard
              icon={<Shield className="size-6" />}
              title="Risk Scoring"
              description="Rank rules, alerts, and notifications by urgency and compliance risk."
            />
            <FeatureCard
              icon={<Zap className="size-6" />}
              title="AI Reasoning"
              description="OpenAI receives selected context and returns structured legal-information JSON."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Same backend flow, cleaner product presentation.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            <StepCard
              step="1"
              title="Upload documents"
              description="Add contracts, permit guides, site notes, or municipal notices."
            />
            <StepCard
              step="2"
              title="AI structures clauses"
              description="The app extracts subclauses and stores embeddings in pgvector."
            />
            <StepCard
              step="3"
              title="Monitor changes"
              description="New laws are matched against project documents and surfaced as alerts."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/50 transition-colors hover:border-primary/30">
      <CardContent className="p-6">
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
        {step}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
