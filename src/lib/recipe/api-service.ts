import { processRecipe } from "./api.functions";
import { mapBackendRecipe } from "./map-backend";
import { getPendingTranscript, loadStoredRecipe, saveRecipe } from "./recipe-store";
import type { ExtractOptions, RecipeService } from "./service";
import { ExtractionError } from "./types";
import { validateVideoUrl } from "./validate-url";

const keys = new Map<string, string>();

/** Calls the Cloudflare backend (via a server function) and stores the result in this tab. */
export const apiRecipeService: RecipeService = {
  async extractRecipe(
    url: string,
    {
      onStage,
      signal,
      idempotencyKey: requestedKey,
      transcript: suppliedTranscript,
      transcriptLanguage,
    }: ExtractOptions = {},
  ) {
    const check = validateVideoUrl(url);
    if (!check.ok) throw new ExtractionError("unsupported", check.message);
    const transcript = suppliedTranscript ?? getPendingTranscript(url) ?? "";
    onStage?.("accessing");
    const keyId = url;
    const idempotencyKey = requestedKey ?? keys.get(keyId) ?? crypto.randomUUID();
    if (!requestedKey) keys.set(keyId, idempotencyKey);
    const t = setTimeout(() => onStage?.("analysing"), 700);
    let res;
    try {
      res = await processRecipe({
        data: {
          url: check.url,
          transcript,
          transcriptLanguage: transcriptLanguage ?? null,
          idempotencyKey,
        },
      });
    } catch {
      throw new ExtractionError(
        "network",
        "We couldn't reach the recipe service. Check your connection and try again.",
      );
    } finally {
      clearTimeout(t);
    }
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (!res.ok) {
      if (res.code === "TRANSCRIPT_REQUIRED") {
        throw new ExtractionError(
          "transcript_required",
          "This video needs a transcript. Copy it from YouTube and paste it below to continue.",
          false,
        );
      }
      if (res.code === "INVALID_TRANSCRIPT") {
        throw new ExtractionError(
          "invalid_transcript",
          "The transcript could not be used. Check it and try again.",
          false,
        );
      }
      if (!res.retryable) keys.delete(keyId);
      const code =
        res.status === 422
          ? "no_recipe"
          : res.status === 0 || res.status >= 500
            ? "network"
            : "unavailable";
      throw new ExtractionError(code, friendly(res.code), res.retryable);
    }
    onStage?.("preparing");
    let recipe;
    try {
      recipe = mapBackendRecipe(JSON.parse(res.json) as unknown, check.url);
    } catch {
      throw new ExtractionError(
        "no_recipe",
        "The recipe service returned a response we couldn't read.",
      );
    }
    saveRecipe(recipe);
    keys.delete(keyId);
    return { recipeId: recipe.id };
  },

  async getRecipe(id: string) {
    return loadStoredRecipe(id);
  },
};

function friendly(code: string) {
  if (
    code === "AI_COST_ESTIMATE_NOT_CONFIGURED" ||
    code.startsWith("AI_") ||
    code.includes("BUDGET")
  ) {
    return "The recipe service isn't available right now. Please try again later.";
  }
  if (code === "RATE_LIMITED" || code === "HTTP_429")
    return "Too many requests right now. Please wait a moment and try again.";
  return "We couldn't generate a recipe right now. Please try again.";
}
