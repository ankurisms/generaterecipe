import type { Recipe } from "./types";

/** Generated recipes and the pending transcript live in sessionStorage for this tab. */
const recipeKey = (id: string) => `recipe:${id}`;
const TRANSCRIPT_KEY = "pending-transcript";

function ss(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveRecipe(recipe: Recipe) {
  ss()?.setItem(recipeKey(recipe.id), JSON.stringify(recipe));
}

export function loadStoredRecipe(id: string): Recipe | null {
  const raw = ss()?.getItem(recipeKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Recipe;
  } catch {
    return null;
  }
}

export function savePendingTranscript(url: string, text: string) {
  ss()?.setItem(TRANSCRIPT_KEY, JSON.stringify({ url, text }));
}

export function getPendingTranscript(url: string): string | null {
  const raw = ss()?.getItem(TRANSCRIPT_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as { url?: string; text?: string };
    // An empty string means "pasted nothing on purpose"; null means nothing was saved for this link.
    return p.url === url && typeof p.text === "string" ? p.text : null;
  } catch {
    return null;
  }
}
