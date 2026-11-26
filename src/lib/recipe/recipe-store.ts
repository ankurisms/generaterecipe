import type { Certainty, Recipe } from "./types";

/** Generated recipes and the pending transcript live in sessionStorage for this tab. */
const recipeKey = (id: string) => `recipe:${id}`;
const TRANSCRIPT_KEY = "pending-transcript";
const memoryRecipes = new Map<string, Recipe>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function isCertainty(value: unknown): value is Certainty {
  return (
    value === "explicit" || value === "observed" || value === "estimated" || value === "unspecified"
  );
}

function isRecipe(value: unknown, id: string): value is Recipe {
  if (
    !isRecord(value) ||
    value["id"] !== id ||
    typeof value["title"] !== "string" ||
    !value["title"].trim()
  ) {
    return false;
  }
  const source = value["source"];
  const servings = value["servings"];
  const prepTime = value["prepTime"];
  const cookTime = value["cookTime"];
  const optionalString = (field: unknown) => field === undefined || typeof field === "string";
  const optionalNumber = (field: unknown) =>
    field === undefined || (typeof field === "number" && Number.isFinite(field));
  const optionalCertainty = (field: unknown) => field === undefined || isCertainty(field);
  const validSourced = (field: unknown) =>
    isRecord(field) &&
    (field["value"] === null ||
      (typeof field["value"] === "number" && Number.isFinite(field["value"]))) &&
    isCertainty(field["certainty"]) &&
    optionalString(field["text"]) &&
    optionalString(field["note"]);
  const ingredients = value["ingredients"];
  const equipment = value["equipment"];
  const steps = value["steps"];
  const validSource =
    isRecord(source) &&
    source["platform"] === "youtube" &&
    optionalString(source["url"]) &&
    optionalString(source["videoTitle"]) &&
    optionalString(source["author"]) &&
    optionalString(source["thumbnailUrl"]);
  return (
    validSource &&
    optionalCertainty(value["titleCertainty"]) &&
    optionalCertainty(value["descriptionCertainty"]) &&
    optionalString(value["description"]) &&
    validSourced(servings) &&
    validSourced(prepTime) &&
    validSourced(cookTime) &&
    Array.isArray(ingredients) &&
    ingredients.every(
      (item) =>
        isRecord(item) &&
        typeof item["id"] === "string" &&
        typeof item["name"] === "string" &&
        (item["amount"] === null ||
          (typeof item["amount"] === "number" && Number.isFinite(item["amount"]))) &&
        isCertainty(item["certainty"]) &&
        optionalString(item["amountText"]) &&
        optionalCertainty(item["amountCertainty"]) &&
        optionalNumber(item["amountMax"]) &&
        optionalString(item["unit"]) &&
        optionalString(item["preparation"]) &&
        optionalCertainty(item["preparationCertainty"]) &&
        optionalString(item["group"]) &&
        optionalString(item["note"]),
    ) &&
    Array.isArray(equipment) &&
    equipment.every(
      (item) =>
        isRecord(item) &&
        typeof item["id"] === "string" &&
        typeof item["name"] === "string" &&
        isCertainty(item["certainty"]) &&
        optionalString(item["note"]),
    ) &&
    Array.isArray(steps) &&
    steps.every(
      (item) =>
        isRecord(item) &&
        typeof item["id"] === "string" &&
        typeof item["text"] === "string" &&
        optionalNumber(item["durationSeconds"]) &&
        optionalCertainty(item["durationCertainty"]) &&
        optionalString(item["durationText"]) &&
        optionalCertainty(item["certainty"]) &&
        optionalString(item["tip"]) &&
        (item["ingredientIds"] === undefined ||
          (Array.isArray(item["ingredientIds"]) &&
            item["ingredientIds"].every((ref) => typeof ref === "string"))),
    ) &&
    (value["warnings"] === undefined ||
      (Array.isArray(value["warnings"]) &&
        value["warnings"].every((warning) => typeof warning === "string")))
  );
}

function ss(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveRecipe(recipe: Recipe) {
  memoryRecipes.set(recipe.id, recipe);
  try {
    ss()?.setItem(recipeKey(recipe.id), JSON.stringify(recipe));
  } catch {
    // Keep the in-memory copy available if sessionStorage is unavailable or full.
  }
}

export function loadStoredRecipe(id: string): Recipe | null {
  const inMemory = memoryRecipes.get(id);
  if (isRecipe(inMemory, id)) return inMemory;
  try {
    const storage = ss();
    const raw = storage?.getItem(recipeKey(id));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecipe(parsed, id)) {
      storage?.removeItem(recipeKey(id));
      return null;
    }
    memoryRecipes.set(id, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function savePendingTranscript(url: string, text: string) {
  try {
    ss()?.setItem(TRANSCRIPT_KEY, JSON.stringify({ url, text }));
  } catch {
    // Transcript persistence is optional; the current form still owns the value.
  }
}

export function getPendingTranscript(url: string): string | null {
  try {
    const raw = ss()?.getItem(TRANSCRIPT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { url?: string; text?: string };
    // An empty string means "pasted nothing on purpose"; null means nothing was saved for this link.
    return p.url === url && typeof p.text === "string" ? p.text : null;
  } catch {
    return null;
  }
}
