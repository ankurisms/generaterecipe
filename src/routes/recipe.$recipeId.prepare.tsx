import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMemo } from "react";

import { AppHeader } from "@/components/recipe/AppHeader";
import { CertaintyTag } from "@/components/recipe/CertaintyTag";
import { ProgressBar } from "@/components/recipe/ProgressBar";
import { RecipeNotFound } from "@/components/recipe/RecipeNotFound";
import { StickyCta } from "@/components/recipe/RecipeSections";
import { Button } from "@/components/ui/button";
import { consolidateIngredients, type ConsolidatedIngredient } from "@/lib/recipe/consolidate";
import { loadRecipe } from "@/lib/recipe/load";
import { useRecipeProgress } from "@/lib/recipe/progress-store";
import { recipeQueryOptions } from "@/lib/recipe/service";
import type { Recipe } from "@/lib/recipe/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recipe/$recipeId/prepare")({
  loader: ({ context, params }) => loadRecipe(context.queryClient, params.recipeId),
  head: ({ loaderData }) => {
    const title = loaderData ? `Prepare: ${loaderData.title} — Recipe` : "Recipe unavailable — Recipe";
    const description = "Check off each ingredient as you get it ready.";
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
  component: Prepare,
});

function Prepare() {
  const { recipeId } = Route.useParams();
  const { data } = useSuspenseQuery(recipeQueryOptions(recipeId));
  const recipe = data as Recipe;
  const items = useMemo(() => consolidateIngredients(recipe.ingredients), [recipe.ingredients]);
  const { progress, toggleReady } = useRecipeProgress(recipeId);

  const readyCount = items.filter((i) => progress.ready.includes(i.key)).length;
  const allReady = readyCount === items.length;
  const remaining = items.length - readyCount;

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader
        left={
          <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full text-muted-foreground">
            <Link to="/recipe/$recipeId" params={{ recipeId }}>
              <ArrowLeft aria-hidden /> Recipe
            </Link>
          </Button>
        }
      />
      <main className="mx-auto w-full max-w-2xl px-5 pt-2 sm:px-8">
        <p className="text-sm font-medium text-muted-foreground">{recipe.title}</p>
        <h1 className="mt-1 font-display text-[2rem] leading-tight font-medium text-foreground sm:text-4xl">
          Get your ingredients ready
        </h1>

        <div className="mt-6 flex items-baseline justify-between text-sm">
          <span className="font-medium text-foreground" aria-live="polite">
            {readyCount} of {items.length} ready
          </span>
          {allReady && (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <Check className="size-4" aria-hidden /> All set
            </span>
          )}
        </div>
        <ProgressBar value={items.length ? readyCount / items.length : 0} label="Preparation progress" className="mt-2" />

        <ul className="mt-6 divide-y divide-border">
          {items.map((item) => (
            <ChecklistRow
              key={item.key}
              item={item}
              checked={progress.ready.includes(item.key)}
              onToggle={() => toggleReady(item.key)}
            />
          ))}
        </ul>
      </main>

      <StickyCta hint={allReady ? "Everything's ready." : `${remaining} still to prepare — you can start anyway.`}>
        <Button asChild size="xl" className="w-full sm:w-auto">
          <Link to="/recipe/$recipeId/cook" params={{ recipeId }} search={{ step: 1 }}>
            Start cooking <ArrowRight aria-hidden />
          </Link>
        </Button>
      </StickyCta>
    </div>
  );
}

function ChecklistRow({
  item,
  checked,
  onToggle,
}: {
  item: ConsolidatedIngredient;
  checked: boolean;
  onToggle: () => void;
}) {
  const quantity = item.quantities
    .map((q) => q ?? "amount not given")
    .join(" + ");
  const hasMissing = item.quantities.includes(null);

  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className="flex w-full items-center gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
      >
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-colors",
            checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
          )}
          aria-hidden
        >
          {checked && <Check className="size-4" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-lg font-medium text-foreground transition-colors",
              checked && "text-muted-foreground line-through decoration-1",
            )}
          >
            {item.name}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            <span className={cn("font-medium text-foreground", checked && "text-muted-foreground", hasMissing && item.quantities.length === 1 && "italic text-unspecified")}>
              {item.certainty === "estimated" && !hasMissing ? "≈ " : ""}
              {quantity}
            </span>
            {item.preparations.length > 0 && <span> · {item.preparations.join("; ")}</span>}
          </span>
        </span>
        {item.certainty !== "explicit" && <CertaintyTag certainty={item.certainty} className="hidden sm:inline-flex" />}
        {item.certainty !== "explicit" && <CertaintyTag certainty={item.certainty} compact className="sm:hidden" />}
      </button>
    </li>
  );
}
