import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Recipe } from "@/lib/recipe/types";
import { loadStoredRecipe, saveRecipe } from "@/lib/recipe/recipe-store";

const recipe: Recipe = {
  id: "recipe-session-test",
  title: "Tomato pasta",
  source: { platform: "youtube", url: "https://youtu.be/dQw4w9WgXcQ" },
  servings: { value: 2, certainty: "explicit" },
  prepTime: { value: null, certainty: "unspecified" },
  cookTime: { value: 15, certainty: "observed" },
  ingredients: [{ id: "tomato", name: "Tomatoes", amount: null, certainty: "unspecified" }],
  equipment: [],
  steps: [{ id: "step-1", text: "Cook the tomatoes." }],
};

describe("recipe session storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("persists recipes by recipe ID", () => {
    saveRecipe(recipe);

    expect(window.sessionStorage.getItem("recipe:recipe-session-test")).toContain("Tomato pasta");
  });

  it("restores a persisted recipe after the in-memory cache is re-created", async () => {
    saveRecipe(recipe);
    vi.resetModules();
    const store = await import("@/lib/recipe/recipe-store");

    expect(store.loadStoredRecipe(recipe.id)).toEqual(recipe);
  });

  it("returns null for missing or invalid cached data", () => {
    expect(loadStoredRecipe("missing")).toBeNull();
    window.sessionStorage.setItem("recipe:broken-json", "{");
    window.sessionStorage.setItem(
      "recipe:wrong-shape",
      JSON.stringify({ id: "wrong-shape", title: "Incomplete" }),
    );

    expect(loadStoredRecipe("broken-json")).toBeNull();
    expect(loadStoredRecipe("wrong-shape")).toBeNull();
  });
});
