import type { Certainty, Ingredient, RecipeStep } from "./types";

const FRACTIONS: Record<string, string> = {
  "0.25": "¼",
  "0.5": "½",
  "0.75": "¾",
  "0.33": "⅓",
  "0.67": "⅔",
};

export function formatNumber(n: number): string {
  const whole = Math.floor(n);
  const rest = Math.round((n - whole) * 100) / 100;
  const frac = FRACTIONS[rest.toFixed(2)] ?? FRACTIONS[String(rest)];
  if (rest === 0) return String(whole);
  if (frac) return whole === 0 ? frac : `${whole}${frac}`;
  return String(Math.round(n * 10) / 10);
}

/** Quantity label for an ingredient, or null when no amount was given. */
export function formatQuantity(ing: Pick<Ingredient, "amount" | "amountMax" | "unit">): string | null {
  if (ing.amount == null) return null;
  const amount =
    ing.amountMax != null
      ? `${formatNumber(ing.amount)}–${formatNumber(ing.amountMax)}`
      : formatNumber(ing.amount);
  return ing.unit ? `${amount} ${ing.unit}` : amount;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** A timer is offered only when the step has a duration backed by the source video. */
export function hasEvidencedTimer(step: RecipeStep): boolean {
  return (
    typeof step.durationSeconds === "number" &&
    step.durationSeconds > 0 &&
    (step.durationCertainty === "explicit" || step.durationCertainty === "observed")
  );
}

export const CERTAINTY_LABEL: Record<Certainty, string> = {
  explicit: "Stated",
  observed: "Seen in video",
  estimated: "Estimated",
  unspecified: "Not specified",
};

export const CERTAINTY_DESCRIPTION: Record<Certainty, string> = {
  explicit: "Said or shown as text in the video.",
  observed: "Visible in the video, but not stated.",
  estimated: "Our best guess. Check before you cook.",
  unspecified: "The video doesn't say. Use your judgement.",
};
