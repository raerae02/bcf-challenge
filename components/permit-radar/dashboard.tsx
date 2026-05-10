"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Coins,
  ExternalLink,
  FileText,
  FolderKanban,
  MapPin,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiskBadge,
  type RiskLevel,
} from "@/components/permit-radar/risk-badge";
import type {
  Alert,
  AnalyzedRegulation,
  ProjectProfile,
  RegulatorySnapshot,
} from "@/lib/types";
import type { ImpactNotification } from "@/lib/rag/types";
import type { SavedFile, SavedProject } from "@/lib/projects";
import { getFile } from "@/lib/file-storage";
import { cn } from "@/lib/utils";

const RISK_ORDER: Record<RiskLevel, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

type AnalyzedSnapshot = RegulatorySnapshot & {
  attachedFilesProcessed?: { filename: string }[];
};

type DashboardProps = {
  snapshot: AnalyzedSnapshot;
  notifications: ImpactNotification[];
  prompt: string;
  projects: SavedProject[];
  activeId: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
};

export function Dashboard({
  snapshot,
  notifications,
  prompt,
  projects,
  activeId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
}: DashboardProps) {
  const { projectProfile, rules, recentAlerts, riskReport, riskOverview } =
    snapshot;
  const alertCount = recentAlerts.length + notifications.length;
  const overallWithNotifications = notifications.reduce<RiskLevel>(
    (current, notification) =>
      RISK_ORDER[notification.urgency] < RISK_ORDER[current]
        ? notification.urgency
        : current,
    riskOverview,
  );

  const sortedRules = useMemo(
    () =>
      [...rules].sort(
        (a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel],
      ),
    [rules],
  );

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <ProjectSwitcher
        projects={projects}
        activeId={activeId}
        onSelectProject={onSelectProject}
        onNewProject={onNewProject}
        onDeleteProject={onDeleteProject}
        onRenameProject={onRenameProject}
      />

      <DashboardStats
        projects={projects}
        ruleCount={rules.length}
        alertCount={alertCount}
        notifications={notifications}
        overall={overallWithNotifications}
      />

      <OverviewPanels
        projects={projects}
        activeId={activeId}
        notifications={notifications}
        recentAlerts={recentAlerts}
        onSelectProject={onSelectProject}
      />

      <ProjectSummary
        profile={projectProfile}
        prompt={prompt}
        ruleCount={rules.length}
        alertCount={alertCount}
        overall={overallWithNotifications}
        savedFiles={projects.find((p) => p.id === activeId)?.files ?? []}
        attachedFiles={snapshot.attachedFilesProcessed}
      />

      <Tabs defaultValue="snapshot">
        <TabsList
          variant="line"
          className="w-full justify-start gap-4 border-b border-border pb-2"
        >
          <TabsTrigger value="snapshot">
            <ClipboardList className="size-4" />
            Snapshot ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="size-4" />
            Alerts
            {alertCount > 0 ? (
              <Badge variant="destructive" className="ml-1">
                {alertCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Shield className="size-4" />
            Risk report
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="size-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snapshot" className="mt-6">
          <SnapshotView rules={sortedRules} />
        </TabsContent>
        <TabsContent value="alerts" className="mt-6">
          <AlertsView alerts={recentAlerts} notifications={notifications} />
        </TabsContent>
        <TabsContent value="risk" className="mt-6">
          <RiskReportView report={riskReport} overall={overallWithNotifications} />
        </TabsContent>
        <TabsContent value="chat" className="mt-6">
          <ChatView profile={projectProfile} projectId={activeId} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ProjectSwitcher({
  projects,
  activeId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
}: {
  projects: SavedProject[];
  activeId: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setRenamingId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const active = projects.find((p) => p.id === activeId);
  const others = projects.filter((p) => p.id !== activeId);

  const startRename = (project: SavedProject) => {
    setRenamingId(project.id);
    setDraftName(project.name);
  };

  const commitRename = (id: string) => {
    onRenameProject(id, draftName);
    setRenamingId(null);
  };

  return (
    <div ref={containerRef} className="relative mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium ring-1 ring-foreground/5 transition-colors hover:bg-muted/60"
          >
            <FolderKanban className="size-4 text-brand" />
            <span className="max-w-[280px] truncate">
              {active?.name ?? "Select project"}
            </span>
            <Badge variant="secondary" className="ml-1">
              {projects.length}
            </Badge>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {projects.length === 1
              ? "1 saved project"
              : `${projects.length} saved projects`}
          </span>
        </div>

        <Button variant="outline" size="sm" onClick={onNewProject}>
          <Plus className="size-3.5" />
          New project
        </Button>
      </div>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-full max-w-md rounded-xl border border-border bg-card p-1.5 shadow-lg ring-1 ring-foreground/5">
          <div className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Your projects
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {[active, ...others].filter(Boolean).map((p) => {
              const project = p as SavedProject;
              const isActive = project.id === activeId;
              const isRenaming = renamingId === project.id;
              return (
                <li
                  key={project.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                    isActive ? "bg-brand/10" : "hover:bg-muted/60",
                  )}
                >
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={() => commitRename(project.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(project.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-brand"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(project.id);
                        setOpen(false);
                      }}
                      className="flex min-w-0 flex-1 flex-col items-start text-left"
                    >
                      <span
                        className={cn(
                          "truncate font-medium",
                          isActive ? "text-foreground" : "text-foreground/90",
                        )}
                      >
                        {project.name}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()} ·{" "}
                        {project.snapshot.rules.length} rules
                      </span>
                    </button>
                  )}

                  {!isRenaming ? (
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startRename(project)}
                        aria-label="Rename project"
                        className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${project.name}"? This cannot be undone.`,
                            )
                          ) {
                            onDeleteProject(project.id);
                          }
                        }}
                        aria-label="Delete project"
                        className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border pt-1.5">
            <button
              type="button"
              onClick={() => {
                onNewProject();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-brand hover:bg-brand/10"
            >
              <Plus className="size-4" />
              New project
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DashboardStats({
  projects,
  ruleCount,
  alertCount,
  notifications,
  overall,
}: {
  projects: SavedProject[];
  ruleCount: number;
  alertCount: number;
  notifications: ImpactNotification[];
  overall: RiskLevel;
}) {
  const documentsAnalyzed = projects.reduce(
    (sum, project) =>
      sum +
      (project.files?.length ??
        project.snapshot.attachedFilesProcessed?.length ??
        0),
    0,
  );
  const stats = [
    {
      label: "Active Projects",
      value: String(projects.length),
      icon: FolderKanban,
      change: projects.length === 1 ? "1 saved project" : `${projects.length} saved projects`,
    },
    {
      label: "Documents Analyzed",
      value: String(documentsAnalyzed),
      icon: FileText,
      change: "Clause-level extraction",
    },
    {
      label: "Active Alerts",
      value: String(alertCount),
      icon: AlertTriangle,
      change:
        notifications.length > 0
          ? `${notifications.length} generated from monitoring`
          : "No generated notifications yet",
    },
    {
      label: "Risk Level",
      value: overall,
      icon: TrendingUp,
      change: `${ruleCount} applicable rules`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-primary/10 p-2">
                <stat.icon className="size-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OverviewPanels({
  projects,
  activeId,
  notifications,
  recentAlerts,
  onSelectProject,
}: {
  projects: SavedProject[];
  activeId: string;
  notifications: ImpactNotification[];
  recentAlerts: Alert[];
  onSelectProject: (id: string) => void;
}) {
  const displayedAlerts = [
    ...notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      project:
        projects.find((project) => project.id === notification.projectId)
          ?.name ?? "Current project",
      severity: notification.urgency,
      description: notification.message,
      time: formatDate(notification.createdAt),
    })),
    ...recentAlerts.slice(0, 3).map((alert) => ({
      id: alert.id,
      title: alert.title,
      project: alert.jurisdiction,
      severity: alert.urgency,
      description: alert.newText,
      time: alert.publishedDate,
    })),
  ].slice(0, 4);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your active compliance projects</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            View All
            <ArrowUpRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.slice(0, 4).map((project) => {
              const isActive = project.id === activeId;
              const fileCount =
                project.files?.length ??
                project.snapshot.attachedFilesProcessed?.length ??
                0;

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50",
                    isActive && "bg-primary/5 ring-1 ring-primary/20",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FolderKanban className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.snapshot.projectProfile.location.city} ·{" "}
                        {fileCount} document{fileCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={isActive ? "default" : "outline"}>
                      {project.snapshot.riskOverview}
                    </Badge>
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                      <Clock className="size-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Compliance updates requiring attention</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            View All
            <ArrowUpRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {displayedAlerts.length > 0 ? (
            <div className="space-y-4">
              {displayedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-3 rounded-lg border border-border p-3"
                >
                  <div
                    className={cn(
                      "shrink-0 rounded-lg p-2",
                      alert.severity === "Critical"
                        ? "bg-destructive/10"
                        : alert.severity === "High"
                          ? "bg-risk-high"
                          : "bg-muted",
                    )}
                  >
                    {alert.severity === "Critical" ||
                    alert.severity === "High" ? (
                      <AlertTriangle className="size-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {alert.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {alert.project}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No alerts yet. Seed or add laws to trigger monitoring.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectSummary({
  profile,
  prompt,
  ruleCount,
  alertCount,
  overall,
  attachedFiles,
  savedFiles,
}: {
  profile: ProjectProfile;
  prompt: string;
  ruleCount: number;
  alertCount: number;
  overall: RiskLevel;
  attachedFiles?: { filename: string }[];
  savedFiles?: SavedFile[];
}) {
  const filesToRender: Array<{ name: string; saved?: SavedFile }> = (
    savedFiles && savedFiles.length > 0
      ? savedFiles.map((f) => ({ name: f.name, saved: f }))
      : (attachedFiles ?? []).map((f) => ({ name: f.filename }))
  );
  return (
    <div className="rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-brand" />
            AI-extracted project profile
          </div>
          <h2 className="font-heading mt-2 text-2xl font-semibold tracking-tight capitalize">
            {profile.businessType}
          </h2>
          {prompt ? (
            <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-muted-foreground">
              &ldquo;{prompt}&rdquo;
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Chip icon={<MapPin className="size-3" />}>
              {profile.location.borough
                ? `${profile.location.borough}, ${profile.location.city}`
                : profile.location.city}
            </Chip>
            {profile.scale.squareFeet ? (
              <Chip icon={<Building2 className="size-3" />}>
                {profile.scale.squareFeet} sq ft
              </Chip>
            ) : null}
            {profile.scale.employees ? (
              <Chip icon={<Users className="size-3" />}>
                {profile.scale.employees} employees
              </Chip>
            ) : null}
            {profile.activities.map((a) => (
              <Chip key={a} icon={<Briefcase className="size-3" />}>
                {humanize(a)}
              </Chip>
            ))}
          </div>

          {filesToRender.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Documents analyzed
              </span>
              {filesToRender.map((f, idx) =>
                f.saved ? (
                  <FileBadge key={f.saved.key} file={f.saved} />
                ) : (
                  <Badge
                    key={`${f.name}-${idx}`}
                    variant="secondary"
                    className="gap-1"
                  >
                    <Paperclip className="size-3" />
                    {f.name}
                  </Badge>
                ),
              )}
            </div>
          ) : null}

          {profile.considerations && profile.considerations.length > 0 ? (
            <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground/80">
              <span className="font-medium">Detected considerations: </span>
              {profile.considerations.join(" · ")}
            </div>
          ) : null}
        </div>

        <div className="flex flex-row gap-3 sm:flex-col sm:items-end">
          <Stat label="Applicable rules" value={ruleCount} />
          <Stat label="Relevant alerts" value={alertCount} accent />
          <RiskBadge level={overall} />
        </div>
      </div>
    </div>
  );
}

function FileBadge({ file }: { file: SavedFile }) {
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  const open = async () => {
    if (busy) return;
    setBusy(true);
    setMissing(false);
    try {
      const stored = await getFile(file.key);
      if (!stored) {
        setMissing(true);
        return;
      }
      const blob =
        stored.blob.type === file.type
          ? stored.blob
          : new Blob([stored.blob], { type: file.type });
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error("Failed to open file", e);
      setMissing(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      title={missing ? "File no longer available" : `Open ${file.name}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-foreground disabled:opacity-60",
        missing && "opacity-60",
      )}
    >
      <Paperclip className="size-3" />
      <span className="max-w-[220px] truncate">{file.name}</span>
      {missing ? (
        <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          unavailable
        </span>
      ) : (
        <ExternalLink className="size-3 opacity-60" />
      )}
    </button>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
      {icon}
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="text-right">
      <div
        className={cn(
          "font-heading text-2xl font-semibold tabular-nums",
          accent && "text-brand",
        )}
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SnapshotView({ rules }: { rules: AnalyzedRegulation[] }) {
  const [openId, setOpenId] = useState<string | null>(rules[0]?.id ?? null);

  if (rules.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
        No applicable regulations identified for this profile.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rules.map((rule) => {
        const open = openId === rule.id;
        const linkedAlerts = rule.recentChanges ?? [];
        return (
          <Card key={rule.id} className="transition-shadow hover:shadow-sm">
            <button
              type="button"
              className="text-left"
              onClick={() => setOpenId(open ? null : rule.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    {rule.title.en || rule.title.fr}
                  </span>
                  <span className="flex items-center gap-2">
                    {linkedAlerts.length > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <Bell className="size-3" />
                        {linkedAlerts.length} change
                        {linkedAlerts.length > 1 ? "s" : ""}
                      </Badge>
                    ) : null}
                    <RiskBadge level={rule.riskLevel} compact />
                  </span>
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="secondary">{rule.category}</Badge>
                  <Badge variant="outline">{rule.jurisdiction}</Badge>
                  <Badge variant="outline">{rule.authority}</Badge>
                </CardDescription>
              </CardHeader>
            </button>
            {open ? (
              <CardContent className="space-y-4 pb-4">
                {rule.whyItApplies ? (
                  <div className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-sm">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-brand">
                      Why it applies
                    </div>
                    <p className="mt-0.5 text-foreground/85">
                      {rule.whyItApplies}
                    </p>
                  </div>
                ) : null}
                <p className="text-sm text-foreground/85">
                  {rule.summary.en || rule.summary.fr}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MetaItem
                    icon={<Clock className="size-3.5" />}
                    label="Estimated timeline"
                    value={formatTimeline(rule.estimatedTimelineDays)}
                  />
                  <MetaItem
                    icon={<Coins className="size-3.5" />}
                    label="Estimated cost"
                    value={formatCost(rule.estimatedCost)}
                  />
                  <MetaItem
                    icon={<ExternalLink className="size-3.5" />}
                    label="Official source"
                    value={
                      <a
                        href={rule.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-foreground hover:underline"
                      >
                        Open
                        <ArrowUpRight className="size-3" />
                      </a>
                    }
                  />
                </div>
                {linkedAlerts.length > 0 ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <Bell className="size-3.5" />
                      Recent changes affecting this rule
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      {linkedAlerts.map((a) => (
                        <li key={a.id} className="text-foreground/90">
                          <span className="font-medium">{a.title}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {a.publishedDate}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function AlertsView({
  alerts,
  notifications,
}: {
  alerts: Alert[];
  notifications: ImpactNotification[];
}) {
  const sorted = useMemo(
    () =>
      [...alerts].sort((a, b) => RISK_ORDER[a.urgency] - RISK_ORDER[b.urgency]),
    [alerts],
  );
  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => RISK_ORDER[a.urgency] - RISK_ORDER[b.urgency],
      ),
    [notifications],
  );

  if (sorted.length === 0 && sortedNotifications.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
        No recent alerts or contract notifications affect this project.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {sortedNotifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            (notification.urgency === "Critical" ||
              notification.urgency === "High") &&
              "ring-2 ring-destructive/30",
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-start justify-between gap-3">
              <span>{notification.title}</span>
              <RiskBadge level={notification.urgency} compact />
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary">Contract notification</Badge>
              <span className="inline-flex items-center gap-1 text-xs">
                <CalendarClock className="size-3" />
                {formatDate(notification.createdAt)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-4">
            <p className="text-sm leading-relaxed text-foreground/90">
              {notification.message}
            </p>
            <div className="grid gap-3">
              {notification.affectedDocuments.map((document) => (
                <div
                  key={document.documentId}
                  className="rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {document.fileName}
                    </span>
                    <Badge variant="outline">
                      {document.affectedSubclauses.length} affected clause
                      {document.affectedSubclauses.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {document.affectedSubclauses.map((clause) => (
                      <div
                        key={clause.chunkId}
                        className="rounded-md bg-background/70 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {clause.clauseTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Clause ID: {clause.clauseId}
                            </div>
                          </div>
                          <RiskBadge level={clause.impactLevel} compact />
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <DeltaBlock
                            label="Why it matters"
                            tone="muted"
                            text={clause.reason}
                          />
                          <DeltaBlock
                            label="Recommended action"
                            tone="brand"
                            text={clause.recommendedAction}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {sorted.map((alert) => (
        <Card
          key={alert.id}
          className={cn(
            (alert.urgency === "Critical" || alert.urgency === "High") &&
              "ring-2 ring-destructive/30",
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-start justify-between gap-3">
              <span>{alert.title}</span>
              <RiskBadge level={alert.urgency} compact />
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary">{alert.source}</Badge>
              <Badge variant="outline">{alert.jurisdiction}</Badge>
              <span className="inline-flex items-center gap-1 text-xs">
                <CalendarClock className="size-3" />
                {alert.publishedDate}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DeltaBlock label="Before" tone="muted" text={alert.oldText} />
              <DeltaBlock label="After" tone="brand" text={alert.newText} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function DeltaBlock({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "muted" | "brand";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "brand"
          ? "border-brand/30 bg-brand/5"
          : "border-border bg-muted/30",
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground/85">{text}</p>
    </div>
  );
}

function RiskReportView({
  report,
  overall,
}: {
  report: RegulatorySnapshot["riskReport"];
  overall: RiskLevel;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-4" />
            Executive summary
          </CardTitle>
          <CardDescription>Overview tailored to your project</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm leading-relaxed text-foreground/90">
            {report.executiveSummary}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Overall risk level</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <RiskBadge level={overall} className="text-sm" />
          <p className="mt-3 text-xs text-muted-foreground">
            {report.disclaimer}
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top risks</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {report.topRisks.length > 0 ? (
            <ol className="space-y-2.5">
              {report.topRisks.map((risk, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-risk-high text-[11px] font-semibold text-risk-high-foreground">
                    {idx + 1}
                  </span>
                  <span className="text-foreground/90">{risk}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              No major risks identified.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended actions</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ul className="space-y-2">
            {report.recommendedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                <span className="text-foreground/90">{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const STARTER_QUESTIONS = [
  "What are my most urgent risks?",
  "What has changed recently for my project?",
  "Which permits should I apply for first?",
];

function FormattedChatMessage({ content }: { content: string }) {
  const lines = content
    .replace(/\*\*/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return <p>{content.replace(/\*\*/g, "")}</p>;
  }

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const isHeading = line.endsWith(":") && line.length < 40;
        const isBullet = line.startsWith("- ");
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);

        if (isHeading) {
          return (
            <p key={index} className="font-semibold text-foreground">
              {line}
            </p>
          );
        }

        if (numberedMatch) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-[11px] font-semibold text-muted-foreground">
                {numberedMatch[1]}
              </span>
              <p>{numberedMatch[2]}</p>
            </div>
          );
        }

        if (isBullet) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <p>{line.slice(2)}</p>
            </div>
          );
        }

        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

function ChatView({
  profile,
  projectId,
}: {
  profile: ProjectProfile;
  projectId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi. I've analyzed your ${profile.businessType.toLowerCase()} project in ${
        profile.location.borough ?? profile.location.city
      }. Ask me anything about permits, zoning, or recent changes.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, profile, projectId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { answer?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer ?? "I couldn't produce an answer.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't answer that yet. Check that the local API and database are running, then try again.",
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-4" />
          Chat with regulatory sources
        </CardTitle>
        <CardDescription>
          RAG over municipal regulations, MAPAQ, RBQ, and the Quebec
          Construction Code
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pt-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.role === "assistant" ? (
                  <FormattedChatMessage content={m.content} />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {pending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                ...
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={pending}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-xl border border-border bg-background p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about permits or regulations..."
            className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            disabled={pending}
          />
          <Button type="submit" size="sm" disabled={!input.trim() || pending}>
            <Send className="size-3.5" />
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function humanize(slug: string): string {
  return slug.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function formatTimeline(
  range: { min: number; max: number } | null,
): React.ReactNode {
  if (!range) return "Variable";
  if (range.min === range.max) return `${range.min} days`;
  return `${range.min}–${range.max} days`;
}

function formatCost(
  cost: { min: number; max: number; currency: "CAD" } | null,
): React.ReactNode {
  if (!cost) return "Variable";
  if (cost.min === cost.max) return `$${cost.min}`;
  return `$${cost.min}–${cost.max}`;
}
