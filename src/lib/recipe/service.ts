import { queryOptions } from "@tanstack/react-query";

import { apiRecipeService } from "./api-service";
import type { ExtractionStage, Recipe } from "./types";

export interface ExtractOptions {
  onStage?: (stage: ExtractionStage) => void;
  signal?: AbortSignal;
}

/**
 * Contract between the UI and the recipe backend. Swap `recipeService` for an
 * HTTP implementation when the extraction API exists; screens stay unchanged.
 */
export interface RecipeService {
  /** Starts extraction for a validated video URL and resolves with the new recipe id. */
  extractRecipe(url: string, options?: ExtractOptions): Promise<{ recipeId: string }>;
  /** Fetches a previously extracted recipe, or null when it doesn't exist. */
  getRecipe(id: string): Promise<Recipe | null>;
}

export const recipeService: RecipeService = apiRecipeService;

export const recipeQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["recipe", id],
    queryFn: () => recipeService.getRecipe(id),
    staleTime: Infinity,
  });
