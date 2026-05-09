import { AlertOctagon, AlertTriangle, CircleDot, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

const STYLES: Record<RiskLevel, string> = {
  Critical:
    "bg-destructive/15 text-destructive ring-1 ring-destructive/30 dark:bg-destructive/30",
  High: "bg-risk-high text-risk-high-foreground",
  Medium: "bg-risk-medium text-risk-medium-foreground",
  Low: "bg-risk-low text-risk-low-foreground",
};

const LABELS: Record<RiskLevel, string> = {
  Critical: "Risque critique",
  High: "Risque élevé",
  Medium: "Risque modéré",
  Low: "Risque faible",
};

const ICONS: Record<RiskLevel, typeof AlertTriangle> = {
  Critical: AlertOctagon,
  High: AlertTriangle,
  Medium: CircleDot,
  Low: ShieldCheck,
};

export function RiskBadge({
  level,
  className,
  compact,
}: {
  level: RiskLevel;
  className?: string;
  compact?: boolean;
}) {
  const Icon = ICONS[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[level],
        className,
      )}
    >
      <Icon className="size-3" />
      {compact ? level : LABELS[level]}
    </span>
  );
}
