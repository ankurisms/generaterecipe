import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/recipe/AppHeader";
import { ProgressBar } from "@/components/recipe/ProgressBar";
import { Button } from "@/components/ui/button";
import { recipeService } from "@/lib/recipe/service";
import { EXTRACTION_STAGES, ExtractionError, type ExtractionStage } from "@/lib/recipe/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing")({
  validateSearch: (search: Record<string, unknown>): { url: string } => ({
    url: typeof search["url"] === "string" ? search["url"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Generating your recipe — Recipe" },
      { name: "description", content: "Reading the cooking video and extracting ingredients and steps." },
      { property: "og:title", content: "Generating your recipe — Recipe" },
      { property: "og:description", content: "Reading the cooking video and extracting ingredients and steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Processing,
});

type State =
  | { status: "running"; stage: ExtractionStage }
  | { status: "error"; stage: ExtractionStage; message: string; retryable: boolean };

function Processing() {
  const { url } = Route.useSearch();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: "running", stage: "accessing" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "running", stage: "accessing" });
    let current: ExtractionStage = "accessing";

    recipeService
      .extractRecipe(url, {
        signal: controller.signal,
        onStage: (stage) => {
          current = stage;
          setState({ status: "running", stage });
        },
      })
      .then(({ recipeId }) => {
        if (controller.signal.aborted) return;
        void navigate({ to: "/recipe/$recipeId", params: { recipeId }, replace: true });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const isKnown = err instanceof ExtractionError;
        setState({
          status: "error",
          stage: current,
          message: isKnown ? err.message : "Something went wrong while reading the video.",
          retryable: !isKnown || err.retryable,
        });
      });

    return () => controller.abort();
  }, [url, attempt, navigate]);

  const stageIndex = EXTRACTION_STAGES.findIndex((s) => s.id === state.stage);
  const progress = state.status === "error" ? (stageIndex + 0.5) / 3 : (stageIndex + 0.6) / 3;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-24">
        {state.status === "running" ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">Working on it</p>
            <h1 className="mt-1 font-display text-3xl font-medium text-foreground">Reading your video</h1>
            <p className="mt-2 truncate text-sm text-muted-foreground" title={url}>
              {url}
            </p>
          </>
        ) : (
          <div role="alert" className="animate-fade-up">
            <AlertCircle className="size-8 text-destructive" aria-hidden />
            <h1 className="mt-3 font-display text-3xl font-medium text-foreground">
              We couldn't make a recipe
            </h1>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{state.message}</p>
          </div>
        )}

        <ProgressBar
          value={progress}
          label="Recipe generation progress"
          className={cn("mt-8", state.status === "error" && "[&>div]:bg-destructive")}
        />

        <ol className="mt-6 space-y-4" aria-live="polite">
          {EXTRACTION_STAGES.map((s, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            const failed = active && state.status === "error";
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-xs",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && !failed && "border-primary text-primary",
                    failed && "border-destructive text-destructive",
                    !done && !active && "border-border text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {done ? (
                    <Check className="size-4" />
                  ) : failed ? (
                    <AlertCircle className="size-4" />
                  ) : active ? (
                    <span className="size-2 rounded-full bg-primary animate-stage-pulse" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-base",
                    done && "text-muted-foreground",
                    active && "font-medium text-foreground",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {s.label}
                  {done && <span className="sr-only"> — done</span>}
                  {failed && <span className="sr-only"> — failed</span>}
                </span>
              </li>
            );
          })}
        </ol>

        {state.status === "error" && (
          <div className="mt-10 flex flex-col gap-3">
            {state.retryable && (
              <Button size="xl" onClick={() => setAttempt((a) => a + 1)}>
                <RotateCcw aria-hidden />
                Try again
              </Button>
            )}
            <Button asChild size="xl" variant="outline" className="bg-transparent">
              <Link to="/">Use a different link</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
