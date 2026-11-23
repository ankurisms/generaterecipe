import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ChefHat, Timer, X } from "lucide-react";
import { useCallback, useEffect, useRef, type ReactNode, type TouchEvent } from "react";

import { CertaintyTag } from "@/components/recipe/CertaintyTag";
import { RecipeNotFound } from "@/components/recipe/RecipeNotFound";
import { QuantityLabel } from "@/components/recipe/RecipeSections";
import { StepTimer } from "@/components/recipe/StepTimer";
import { Button } from "@/components/ui/button";
import { alertTimerDone, useStepTimers } from "@/hooks/use-step-timers";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { formatClock, formatMinutes, hasEvidencedTimer } from "@/lib/recipe/format";
import { loadRecipe } from "@/lib/recipe/load";
import { useRecipeProgress } from "@/lib/recipe/progress-store";
import { recipeQueryOptions } from "@/lib/recipe/service";
import type { Recipe, RecipeStep } from "@/lib/recipe/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recipe/$recipeId/cook")({
  validateSearch: (search: Record<string, unknown>): { step?: number } => {
    const n = Number(search["step"]);
    return Number.isFinite(n) && n >= 1 ? { step: Math.floor(n) } : {};
  },
  loader: ({ context, params }) => loadRecipe(context.queryClient, params.recipeId),
  head: ({ loaderData }) => {
    const title = loaderData ? `Cook: ${loaderData.title} — Recipe` : "Recipe unavailable — Recipe";
    const description = "Follow the recipe one step at a time.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  notFoundComponent: RecipeNotFound,
  component: CookMode,
});

function CookMode() {
  const { recipeId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useSuspenseQuery(recipeQueryOptions(recipeId));
  const recipe = data as Recipe;
  const { progress, setStepComplete, resetSteps } = useRecipeProgress(recipeId);
  const timers = useStepTimers(() => alertTimerDone());
  useWakeLock();

  const total = recipe.steps.length;
  const stepNumber = Math.min(search.step ?? 1, total + 1);
  const finished = stepNumber > total;
  const step = recipe.steps[stepNumber - 1];

  const goTo = useCallback(
    (n: number) => {
      void navigate({ search: { step: Math.max(1, Math.min(n, total + 1)) }, replace: true });
    },
    [navigate, total],
  );

  // Keyboard: arrows to move, space/enter handled by focused buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") goTo(stepNumber + 1);
      if (e.key === "ArrowLeft") goTo(stepNumber - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, stepNumber]);

  // Horizontal swipe on the instruction area.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    const t = e.changedTouches[0];
    touchStart.current = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(stepNumber + (dx < 0 ? 1 : -1));
  };

  const otherTimers = timers.activeIds
    .filter((id) => id !== step?.id)
    .map((id) => {
      const idx = recipe.steps.findIndex((s) => s.id === id);
      const s = recipe.steps[idx];
      return s && s.durationSeconds ? { idx, view: timers.get(id, s.durationSeconds * 1000) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top bar */}
      <header className="mx-auto w-full max-w-2xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          <Button asChild variant="ghost" size="touch" className="-ml-2 px-3 text-muted-foreground">
            <Link to="/recipe/$recipeId" params={{ recipeId }} aria-label="Exit cook mode and return to recipe overview">
              <X aria-hidden /> Overview
            </Link>
          </Button>
          <p className="text-sm font-medium tabular-nums text-muted-foreground">
            {finished ? "Done" : `Step ${stepNumber} of ${total}`}
          </p>
        </div>
        <div className="flex gap-1" aria-hidden>
          {recipe.steps.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                progress.completedSteps.includes(s.id)
                  ? "bg-primary"
                  : i === stepNumber - 1
                    ? "bg-foreground/60"
                    : "bg-border",
              )}
            />
          ))}
        </div>
        <span className="sr-only">
          {progress.completedSteps.length} of {total} steps complete
        </span>

        {otherTimers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {otherTimers.map(({ idx, view }) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx + 1)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium tabular-nums",
                  view.done ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                <Timer className="size-4" aria-hidden />
                Step {idx + 1} · {view.done ? "Time's up" : formatClock(view.remainingMs / 1000)}
              </button>
            ))}
          </div>
        )}
      </header>

      {finished ? (
        <Finished recipe={recipe} recipeId={recipeId} onRestart={() => { resetSteps(); goTo(1); }} onBack={() => goTo(total)} />
      ) : step ? (
        <>
          <main
            className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-6 pt-8 sm:px-6 sm:pt-12"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <StepContent
              key={step.id}
              step={step}
              stepNumber={stepNumber}
              recipe={recipe}
              timer={
                hasEvidencedTimer(step) ? (
                  <StepTimer
                    view={timers.get(step.id, step.durationSeconds! * 1000)}
                    onStart={() => timers.start(step.id, step.durationSeconds! * 1000)}
                    onPause={() => timers.pause(step.id)}
                    onReset={() => timers.reset(step.id)}
                  />
                ) : null
              }
            />
          </main>

          {/* Bottom controls, in thumb reach */}
          <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
              <CompleteToggle
                done={progress.completedSteps.includes(step.id)}
                onToggle={() => setStepComplete(step.id)}
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon-touch"
                  className="size-14 shrink-0 bg-transparent"
                  onClick={() => goTo(stepNumber - 1)}
                  disabled={stepNumber === 1}
                  aria-label="Previous step"
                >
                  <ArrowLeft aria-hidden />
                </Button>
                <Button size="xl" className="flex-1" onClick={() => goTo(stepNumber + 1)}>
                  {stepNumber === total ? "Finish" : "Next step"}
                  <ArrowRight aria-hidden />
                </Button>
              </div>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );
}

function StepContent({
  step,
  stepNumber,
  recipe,
  timer,
}: {
  step: RecipeStep;
  stepNumber: number;
  recipe: Recipe;
  timer: ReactNode;
}) {
  const used = (step.ingredientIds ?? [])
    .map((id) => recipe.ingredients.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => !!i);
  const estimatedDuration =
    !timer && step.durationSeconds && step.durationCertainty && step.durationCertainty !== "unspecified";

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <p className="font-display text-lg text-primary tabular-nums">Step {stepNumber}</p>
        <p className="mt-3 text-[1.75rem] leading-[1.3] font-medium text-foreground sm:text-4xl sm:leading-[1.25]">
          {step.text}
        </p>
      </div>

      {timer}

      {estimatedDuration && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm text-muted-foreground">
          <CertaintyTag certainty={step.durationCertainty!} />
          <span>
            About {formatMinutes(Math.max(1, Math.round(step.durationSeconds! / 60)))}. The video doesn't confirm the time, so
            go by the cue rather than a timer.
          </span>
        </div>
      )}

      {used.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">You'll need</p>
          <ul className="mt-2 divide-y divide-border">
            {used.map((ing) => (
              <li key={ing.id} className="flex items-baseline justify-between gap-4 py-2.5 text-base">
                <span className="text-foreground">
                  {ing.name}
                  {ing.preparation && <span className="text-muted-foreground">, {ing.preparation}</span>}
                </span>
                <QuantityLabel ingredient={ing} className="shrink-0 text-right" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {step.tip && (
        <p className="border-l-2 border-primary pl-4 text-base leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Tip: </span>
          {step.tip}
        </p>
      )}
    </div>
  );
}

function CompleteToggle({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-full border text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        done ? "border-primary bg-primary/10 text-primary" : "border-input text-foreground hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full border-2",
          done ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
        aria-hidden
      >
        {done && <Check className="size-3" strokeWidth={3} />}
      </span>
      {done ? "Step complete" : "Mark step complete"}
    </button>
  );
}

function Finished({
  recipe,
  recipeId,
  onRestart,
  onBack,
}: {
  recipe: Recipe;
  recipeId: string;
  onRestart: () => void;
  onBack: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-24 text-center animate-fade-up">
      <ChefHat className="mx-auto size-10 text-primary" aria-hidden />
      <h1 className="mt-4 font-display text-4xl font-medium text-foreground">Enjoy your meal</h1>
      <p className="mt-2 text-base text-muted-foreground">{recipe.title} is ready to serve.</p>
      <div className="mt-10 flex flex-col gap-3">
        <Button asChild size="xl">
          <Link to="/recipe/$recipeId" params={{ recipeId }}>
            Back to recipe
          </Link>
        </Button>
        <Button size="xl" variant="outline" className="bg-transparent" onClick={onBack}>
          Review last step
        </Button>
        <button type="button" onClick={onRestart} className="mt-2 text-sm font-medium text-primary hover:underline">
          Cook it again from step 1
        </button>
      </div>
    </main>
  );
}
