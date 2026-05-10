import { ArrowRight, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  onReset?: () => void;
  showReset?: boolean;
};

export function AppHeader({ onReset, showReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button
          type="button"
          onClick={onReset}
          className="group flex items-center gap-2 text-left"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radar className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Permit Radar AI
          </span>
        </button>
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {showReset && onReset ? (
            <Button variant="ghost" size="sm" onClick={onReset}>
              New project
            </Button>
          ) : null}
          <Button size="sm" onClick={onReset}>
            Get Started
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
