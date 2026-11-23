import { CircleHelp, Eye, Quote, Waves } from "lucide-react";

import { CERTAINTY_DESCRIPTION, CERTAINTY_LABEL } from "@/lib/recipe/format";
import type { Certainty } from "@/lib/recipe/types";
import { cn } from "@/lib/utils";

export const CERTAINTY_ICON = {
  explicit: Quote,
  observed: Eye,
  estimated: Waves,
  unspecified: CircleHelp,
} as const;

const TONE: Record<Certainty, string> = {
  explicit: "text-explicit bg-explicit/10",
  observed: "text-observed bg-observed/10",
  estimated: "text-estimated bg-estimated/12",
  unspecified: "text-unspecified bg-unspecified/10",
};

export function CertaintyTag({
  certainty,
  className,
  compact = false,
}: {
  certainty: Certainty;
  className?: string;
  compact?: boolean;
}) {
  const Icon = CERTAINTY_ICON[certainty];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        TONE[certainty],
        className,
      )}
      title={CERTAINTY_DESCRIPTION[certainty]}
    >
      <Icon className="size-3" aria-hidden />
      {compact ? <span className="sr-only">{CERTAINTY_LABEL[certainty]}</span> : CERTAINTY_LABEL[certainty]}
    </span>
  );
}

export function CertaintyLegend({ className }: { className?: string }) {
  const items: Certainty[] = ["explicit", "observed", "estimated", "unspecified"];
  return (
    <div className={cn("rounded-2xl bg-surface p-4 sm:p-5", className)}>
      <p className="text-sm font-semibold text-foreground">How to read this recipe</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Every detail shows where it came from. Untagged details were stated in the video.
      </p>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {items.map((c) => (
          <li key={c} className="flex items-start gap-2.5 text-sm">
            <CertaintyTag certainty={c} className="mt-px" />
            <span className="text-muted-foreground">{CERTAINTY_DESCRIPTION[c]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
