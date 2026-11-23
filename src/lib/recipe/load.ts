import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { recipeQueryOptions } from "./service";

/** Shared loader for recipe screens: primes the query cache or throws notFound. */
export async function loadRecipe(queryClient: QueryClient, recipeId: string) {
  const recipe = await queryClient.ensureQueryData(recipeQueryOptions(recipeId));
  if (!recipe) throw notFound();
  return { title: recipe.title };
}
