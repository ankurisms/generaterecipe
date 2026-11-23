import { Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TimerView } from "@/hooks/use-step-timers";
import { formatClock } from "@/lib/recipe/format";
import { cn } from "@/lib/utils";

export function StepTimer({
  view,
  onStart,
  onPause,
  onReset,
}: {
  view: TimerView;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition-colors",
        view.done ? "border-primary bg-primary/10" : "border-border bg-card",
      )}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {view.done ? "Time's up" : view.running ? "Timer running" : "Timer"}
        </p>
        <p
          className={cn(
            "font-display text-5xl leading-none tabular-nums text-foreground",
            view.done && "text-primary",
          )}
          role="timer"
          aria-live={view.done ? "assertive" : "off"}
        >
          {formatClock(view.remainingMs / 1000)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {view.started && (
          <Button variant="outline" size="icon-touch" onClick={onReset} aria-label="Reset timer" className="bg-transparent">
            <RotateCcw aria-hidden />
          </Button>
        )}
        {!view.done &&
          (view.running ? (
            <Button variant="secondary" size="touch" onClick={onPause}>
              <Pause aria-hidden /> Pause
            </Button>
          ) : (
            <Button variant="secondary" size="touch" onClick={onStart}>
              <Play aria-hidden /> {view.started ? "Resume" : "Start"}
            </Button>
          ))}
      </div>
    </div>
  );
}
