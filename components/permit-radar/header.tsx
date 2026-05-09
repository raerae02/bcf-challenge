import { Radar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type HeaderProps = {
  onReset?: () => void;
  showReset?: boolean;
};

export function AppHeader({ onReset, showReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={onReset}
          className="group flex items-center gap-2 text-left"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground ring-1 ring-foreground/10">
            <Radar className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-sm font-semibold tracking-tight">
              Regulation Radar AI
            </span>
            <span className="text-xs text-muted-foreground">
              Smart permit and compliance monitoring
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="size-3" />
            Gemini 2.5 · BCF Hackathon
          </Badge>
          {showReset && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              New project
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
