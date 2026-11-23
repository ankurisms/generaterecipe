import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("font-display text-xl font-semibold tracking-tight text-foreground", className)}
      aria-label="Recipe — home"
    >
      Recipe<span className="text-primary">.</span>
    </Link>
  );
}

export function AppHeader({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
      <div className="flex min-w-0 items-center gap-2">{left ?? <Wordmark />}</div>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
