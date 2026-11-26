import type { Certainty, Equipment, Ingredient, Recipe, RecipeStep, SourcedValue } from "./types";

/**
 * Maps the backend recipe JSON into the frontend Recipe type. The mapper is
 * tolerant of snake_case/camelCase and nesting (`recipe`, `data`) so small
 * response-shape differences don't lose information. Unknown certainty ⇒ "unspecified".
 */
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const pick = (o: Obj, ...keys: string[]) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
};

export function toCertainty(v: unknown): Certainty {
  const value = isObj(v) ? v["kind"] : v;
  const s = typeof value === "string" ? value.toLowerCase() : "";
  if (["explicit", "stated", "spoken", "on_screen", "on_screen_text", "transcript"].includes(s))
    return "explicit";
  if (["observed", "visual", "visually_observed", "seen"].includes(s)) return "observed";
  if (["estimated", "inferred", "estimate", "assumed"].includes(s)) return "estimated";
  return "unspecified";
}

function certOf(o: Obj) {
  return toCertainty(
    pick(o, "certainty", "provenance", "source_type", "sourceType", "confidence_type"),
  );
}

function textValue(v: unknown): string | undefined {
  return isObj(v) ? str(pick(v, "value", "text")) : str(v);
}

function sourced(v: unknown, minutesFromSeconds = false): SourcedValue<number> {
  if (isObj(v)) {
    let value = num(pick(v, "value", "amount", "minutes", "quantity"));
    if (value == null && minutesFromSeconds) {
      const s = num(pick(v, "seconds"));
      if (s != null) value = Math.round(s / 60);
    }
    const note = str(pick(v, "note", "evidence"));
    const text = str(pick(v, "text"));
    return {
      value,
      certainty: toCertainty(pick(v, "certainty", "provenance")),
      ...(text ? { text } : {}),
      ...(note ? { note } : {}),
    };
  }
  const value = num(v);
  return { value, certainty: value == null ? "unspecified" : "explicit" };
}

function slug(s: string, i: number) {
  return `${
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "item"
  }-${i}`;
}

function mapIngredient(raw: unknown, i: number): Ingredient | null {
  if (typeof raw === "string")
    return { id: slug(raw, i), name: raw, amount: null, certainty: "unspecified" };
  if (!isObj(raw)) return null;
  const name = textValue(pick(raw, "name", "ingredient", "item"));
  if (!name) return null;
  const q = pick(raw, "quantity", "amount");
  const qObj = isObj(q) ? q : raw;
  const amount = num(isObj(q) ? pick(q, "value", "amount", "min") : q);
  const amountText = str(pick(qObj, "amount_text", "amountText"));
  const amountMax = num(pick(qObj, "amount_max", "amountMax", "max"));
  const unit = str(pick(qObj, "unit")) ?? str(pick(raw, "unit"));
  const prepNotes = pick(raw, "preparation_notes", "preparationNotes");
  const preparation =
    (Array.isArray(prepNotes)
      ? prepNotes.map(textValue).filter((text): text is string => !!text)
      : []
    ).join(", ") || str(pick(raw, "preparation", "prep", "notes_preparation"));
  const preparationCertainty = Array.isArray(prepNotes)
    ? toCertainty(pick(isObj(prepNotes[0]) ? prepNotes[0] : {}, "provenance", "certainty"))
    : undefined;
  const group = str(pick(raw, "group", "section"));
  const note = str(pick(raw, "note", "notes", "evidence"));
  const amountCertainty =
    amount != null || amountText
      ? isObj(q)
        ? toCertainty(pick(q, "certainty", "provenance"))
        : certOf(raw)
      : "unspecified";
  return {
    id: str(pick(raw, "id")) ?? slug(name, i),
    name,
    amount,
    ...(amountText ? { amountText } : {}),
    amountCertainty,
    ...(amountMax != null && amount != null ? { amountMax } : {}),
    ...(unit ? { unit } : {}),
    ...(preparation ? { preparation } : {}),
    ...(preparationCertainty && preparation ? { preparationCertainty } : {}),
    ...(group ? { group } : {}),
    certainty: amountCertainty,
    ...(note ? { note } : {}),
  };
}

function mapEquipment(raw: unknown, i: number): Equipment | null {
  if (typeof raw === "string") return { id: slug(raw, i), name: raw, certainty: "unspecified" };
  if (!isObj(raw)) return null;
  const name = textValue(pick(raw, "name", "item")) ?? textValue(raw);
  if (!name) return null;
  const note = str(pick(raw, "note", "evidence"));
  return {
    id: str(pick(raw, "id")) ?? slug(name, i),
    name,
    certainty: certOf(raw),
    ...(note ? { note } : {}),
  };
}

function mapStep(raw: unknown, i: number, ingredients: Ingredient[]): RecipeStep | null {
  if (typeof raw === "string") return { id: `step-${i + 1}`, text: raw };
  if (!isObj(raw)) return null;
  const text = textValue(pick(raw, "text", "instruction", "description"));
  if (!text) return null;
  const d = pick(raw, "duration", "timer", "time");
  let seconds = num(pick(raw, "duration_seconds", "durationSeconds"));
  let dc: Certainty | undefined;
  let durationText: string | undefined;
  if (isObj(d)) {
    seconds ??= num(pick(d, "seconds", "duration_seconds"));
    const mins = num(pick(d, "minutes", "value"));
    if (seconds == null && mins != null) seconds = mins * 60;
    dc = toCertainty(pick(d, "certainty", "provenance"));
    durationText = str(pick(d, "text"));
  } else {
    const mins = num(pick(raw, "duration_minutes", "durationMinutes"));
    if (seconds == null && mins != null) seconds = mins * 60;
    dc = toCertainty(pick(raw, "duration_certainty", "durationCertainty"));
  }
  const tip = str(pick(raw, "tip", "note"));
  const refs = pick(raw, "ingredient_ids", "ingredientIds", "ingredients");
  const ingredientIds = Array.isArray(refs)
    ? refs
        .map((r) =>
          typeof r === "string"
            ? (ingredients.find((x) => x.id === r || x.name.toLowerCase() === r.toLowerCase())
                ?.id ?? null)
            : null,
        )
        .filter((x): x is string => !!x)
    : [];
  return {
    id: str(pick(raw, "id")) ?? `step-${i + 1}`,
    text,
    ...(seconds != null && seconds > 0 ? { durationSeconds: seconds } : {}),
    ...((seconds != null && seconds > 0) || durationText
      ? { durationCertainty: dc ?? "unspecified" }
      : {}),
    ...(durationText ? { durationText } : {}),
    ...(pick(raw, "provenance") !== undefined ? { certainty: certOf(raw) } : {}),
    ...(tip ? { tip } : {}),
    ...(ingredientIds.length ? { ingredientIds } : {}),
  };
}

function compact<T>(arr: (T | null)[]): T[] {
  return arr.filter((x): x is T => x !== null);
}

export function mapBackendRecipe(body: unknown, sourceUrl: string): Recipe {
  let r: unknown = body;
  for (const k of ["data", "recipe", "result"]) if (isObj(r) && isObj(r[k])) r = r[k];
  if (isObj(r) && isObj(r["recipe"])) r = r["recipe"];
  if (!isObj(r)) throw new Error("The recipe service returned an unexpected response.");

  const ingredients = compact(
    (Array.isArray(r["ingredients"]) ? r["ingredients"] : []).map(mapIngredient),
  );
  const equipment = compact(
    (Array.isArray(r["equipment"]) ? r["equipment"] : []).map(mapEquipment),
  );
  const stepsRaw = pick(r, "steps", "instructions", "method");
  const steps = compact(
    (Array.isArray(stepsRaw) ? stepsRaw : []).map((s, i) => mapStep(s, i, ingredients)),
  );
  if (!ingredients.length && !steps.length)
    throw new Error("No recipe could be found in this video's transcript.");

  const src = isObj(r["source"]) ? r["source"] : {};
  const titleField = pick(r, "title", "name");
  const title = textValue(titleField) ?? "Untitled recipe";
  const id =
    str(pick(isObj(body) ? body : {}, "id", "recipe_id", "recipeId")) ??
    str(pick(r, "id")) ??
    crypto.randomUUID();
  const descriptionField = pick(r, "description", "summary");
  const description = textValue(descriptionField);
  const videoTitle = textValue(pick(src, "video_title", "videoTitle", "title"));
  const author = textValue(pick(src, "author", "channel", "channel_name", "creator"));
  const videoId = str(pick(src, "video_id", "videoId"));
  const thumbnailUrl =
    str(pick(src, "thumbnail_url", "thumbnailUrl")) ??
    (videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : undefined);
  const warnings = Array.isArray(r["warnings"])
    ? r["warnings"].filter(
        (warning): warning is string => typeof warning === "string" && Boolean(warning.trim()),
      )
    : [];
  return {
    id,
    title,
    ...(isObj(titleField) ? { titleCertainty: certOf(titleField) } : {}),
    ...(description ? { description } : {}),
    ...(isObj(descriptionField) ? { descriptionCertainty: certOf(descriptionField) } : {}),
    source: {
      platform: "youtube",
      url: str(pick(src, "url", "original_url")) ?? sourceUrl,
      ...(videoTitle ? { videoTitle } : {}),
      ...(author ? { author } : {}),
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    },
    servings: sourced(pick(r, "servings", "yield")),
    prepTime: sourced(pick(r, "prep_time", "prepTime", "prep_time_minutes"), true),
    cookTime: sourced(pick(r, "cook_time", "cookTime", "cook_time_minutes"), true),
    ingredients,
    equipment,
    steps,
    ...(warnings.length ? { warnings } : {}),
  };
}
