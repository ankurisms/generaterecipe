import type { Certainty, Ingredient } from "./types";
import { formatQuantity } from "./format";

export interface ConsolidatedIngredient {
  /** Stable key derived from the name. */
  key: string;
  name: string;
  /** One label per distinct quantity; null entries mean "amount not given". */
  quantities: (string | null)[];
  /** The least certain of the merged entries. */
  certainty: Certainty;
  preparations: string[];
  sourceIds: string[];
}

const CERTAINTY_RANK: Record<Certainty, number> = {
  explicit: 0,
  observed: 1,
  estimated: 2,
  unspecified: 3,
};

export function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Merges ingredients that appear more than once (e.g. garlic in a sauce and a garnish).
 * Amounts with the same unit and certainty are summed; anything else is kept side by side
 * so a missing or uncertain amount is never hidden inside a total.
 */
export function consolidateIngredients(ingredients: Ingredient[]): ConsolidatedIngredient[] {
  const groups = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    const key = normaliseName(ing.name);
    const list = groups.get(key) ?? [];
    list.push(ing);
    groups.set(key, list);
  }

  return [...groups.entries()].map(([key, list]) => {
    const first = list[0]!;
    const summed = new Map<string, Ingredient>();
    const passthrough: Ingredient[] = [];

    for (const ing of list) {
      if (ing.amount == null || ing.amountMax != null) {
        passthrough.push(ing);
        continue;
      }
      const k = `${ing.unit ?? ""}|${ing.certainty}`;
      const existing = summed.get(k);
      summed.set(k, existing ? { ...existing, amount: (existing.amount ?? 0) + ing.amount } : { ...ing });
    }

    const quantities = [...summed.values(), ...passthrough].map((i) => formatQuantity(i));
    // Keep one "not given" marker at most.
    const deduped = quantities.filter((q, i) => q !== null || quantities.indexOf(null) === i);

    const certainty = list.reduce<Certainty>(
      (worst, i) => (CERTAINTY_RANK[i.certainty] > CERTAINTY_RANK[worst] ? i.certainty : worst),
      "explicit",
    );

    return {
      key,
      name: first.name,
      quantities: deduped,
      certainty,
      preparations: [...new Set(list.map((i) => i.preparation).filter((p): p is string => !!p))],
      sourceIds: list.map((i) => i.id),
    };
  });
}
