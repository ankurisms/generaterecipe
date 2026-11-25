import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";

import { AppHeader } from "@/components/recipe/AppHeader";
import { CertaintyLegend } from "@/components/recipe/CertaintyTag";
import { RecipeNotFound } from "@/components/recipe/RecipeNotFound";
import {
  EquipmentList,
  IngredientList,
  MethodList,
  RecipeMeta,
  SectionHeading,
  SourceThumbnail,
  SourceAttribution,
  StickyCta,
  UncertaintySummary,
} from "@/components/recipe/RecipeSections";
import { SiteFooter } from "@/components/recipe/SiteFooter";
import { Button } from "@/components/ui/button";
import { loadRecipe } from "@/lib/recipe/load";
import { recipeQueryOptions } from "@/lib/recipe/service";
import type { Recipe } from "@/lib/recipe/types";

export const Route = createFileRoute("/recipe/$recipeId/")({
  // Recipes live in this tab\'s sessionStorage, so these screens render in the browser only.
  ssr: false,
  loader: ({ context, params }) => loadRecipe(context.queryClient, params.recipeId),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Recipe` : "Recipe unavailable — Recipe";
    const description = "Ingredients, equipment and method extracted from a cooking video.";
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
  component: RecipeReview,
});

function RecipeReview() {
  const { recipeId } = Route.useParams();
  const { data } = useSuspenseQuery(recipeQueryOptions(recipeId));
  const recipe = data as Recipe;

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader
        right={
          <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground">
            <Link to="/">
              <Plus aria-hidden /> New recipe
            </Link>
          </Button>
        }
      />
      <main className="mx-auto grid w-full max-w-5xl gap-10 px-5 pt-2 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <section className="space-y-6">
          <SourceThumbnail recipe={recipe} />
          <div>
            <h1 className="font-display text-[2rem] leading-tight font-medium text-foreground sm:text-4xl">
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{recipe.description}</p>
            )}
          </div>
          <RecipeMeta recipe={recipe} />
          <UncertaintySummary recipe={recipe} />
          <SourceAttribution recipe={recipe} />
        </section>

        <div className="space-y-12">
          <CertaintyLegend />
          <section aria-labelledby="ingredients">
            <SectionHeading aside={`${recipe.ingredients.length} items`}>
              <span id="ingredients">Ingredients</span>
            </SectionHeading>
            <div className="pt-2">
              <IngredientList ingredients={recipe.ingredients} />
            </div>
          </section>
          <section aria-labelledby="equipment">
            <SectionHeading>
              <span id="equipment">Equipment</span>
            </SectionHeading>
            <EquipmentList equipment={recipe.equipment} />
          </section>
          <section aria-labelledby="method">
            <SectionHeading aside={`${recipe.steps.length} steps`}>
              <span id="method">Method</span>
            </SectionHeading>
            <div className="pt-5">
              <MethodList steps={recipe.steps} />
            </div>
          </section>
        </div>
      </main>
      <div className="mt-16">
        <SiteFooter />
      </div>

      <StickyCta hint="Next, gather everything before you start cooking.">
        <Button asChild size="xl" className="w-full sm:w-auto">
          <Link to="/recipe/$recipeId/prepare" params={{ recipeId }}>
            Prepare ingredients <ArrowRight aria-hidden />
          </Link>
        </Button>
      </StickyCta>
    </div>
  );
}
