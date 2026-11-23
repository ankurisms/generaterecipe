import { MOCK_RECIPE } from "./mock-data";
import type { ExtractOptions, RecipeService } from "./service";
import { ExtractionError, type ExtractionStage } from "./types";
import { validateVideoUrl } from "./validate-url";

const STAGE_DURATIONS: [ExtractionStage, number][] = [
  ["accessing", 1100],
  ["analysing", 1900],
  ["preparing", 900],
];

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

/**
 * Simulates the extraction pipeline. Any supported link returns the sample recipe.
 * Links containing "private" fail at the first stage so the error state can be tested.
 */
export const mockRecipeService: RecipeService = {
  async extractRecipe(url: string, { onStage, signal }: ExtractOptions = {}) {
    const check = validateVideoUrl(url);
    if (!check.ok) throw new ExtractionError("unsupported", check.message);

    for (const [stage, ms] of STAGE_DURATIONS) {
      onStage?.(stage);
      await wait(ms, signal);
      if (stage === "accessing" && /private/i.test(url)) {
        throw new ExtractionError(
          "unavailable",
          "We couldn't open this video. It may be private, deleted or age-restricted.",
        );
      }
    }
    return { recipeId: MOCK_RECIPE.id };
  },

  async getRecipe(id: string) {
    return id === MOCK_RECIPE.id ? MOCK_RECIPE : null;
  },
};
