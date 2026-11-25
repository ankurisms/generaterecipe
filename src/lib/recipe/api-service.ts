import { processRecipe } from "./api.functions";
import { mapBackendRecipe } from "./map-backend";
import { getPendingTranscript, loadStoredRecipe, saveRecipe } from "./recipe-store";
import type { ExtractOptions, RecipeService } from "./service";
import { ExtractionError } from "./types";
import { validateVideoUrl } from "./validate-url";

const keys = new Map<string, string>();

/** Calls the Cloudflare backend (via a server function) and stores the result in this tab. */
export const apiRecipeService: RecipeService = {
  async extractRecipe(url: string, { onStage, signal }: ExtractOptions = {}) {
    const check = validateVideoUrl(url);
    if (!check.ok) throw new ExtractionError("unsupported", check.message);
    // The transcript is optional: the backend can read the video itself.
    const transcript = getPendingTranscript(url) ?? "";
    onStage?.("accessing");
    // Same key on retry of the same submission, so the backend can dedupe.
    const keyId = `${url}\n${transcript.length}`;
    const idempotencyKey = keys.get(keyId) ?? crypto.randomUUID();
    keys.set(keyId, idempotencyKey);
    const t = setTimeout(() => onStage?.("analysing"), 700);
    let res;
    try {
      res = await processRecipe({ data: { url: check.url, transcript, idempotencyKey } });
    } catch {
      throw new ExtractionError("network", "We couldn't reach the recipe service. Check your connection and try again.");
    } finally {
      clearTimeout(t);
    }
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (!res.ok) {
      if (!res.retryable) keys.delete(keyId);
      const code = res.status === 422 ? "no_recipe" : res.status === 0 || res.status >= 500 ? "network" : "unavailable";
      throw new ExtractionError(code, friendly(res.code, res.message), res.retryable);
    }
    onStage?.("preparing");
    let recipe;
    try {
      recipe = mapBackendRecipe(JSON.parse(res.json) as unknown, check.url);
    } catch (e) {
      throw new ExtractionError("no_recipe", e instanceof Error ? e.message : "The recipe couldn't be read.");
    }
    saveRecipe(recipe);
    keys.delete(keyId);
    return { recipeId: recipe.id };
  },

  async getRecipe(id: string) {
    return loadStoredRecipe(id);
  },
};

function friendly(code: string, message: string) {
  if (code === "AI_COST_ESTIMATE_NOT_CONFIGURED" || code.startsWith("AI_") || code.includes("BUDGET")) {
    return `The recipe service isn't available right now (${code}). Please try again later.`;
  }
  if (code === "RATE_LIMITED" || code === "HTTP_429") return "Too many requests right now. Please wait a moment and try again.";
  return message;
}
