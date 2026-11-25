import { describe, expect, it } from "vitest";

import { mapBackendRecipe } from "@/lib/recipe/map-backend";

const body = {
  recipe: {
    id: "r1",
    title: "Scrambled eggs",
    servings: { value: 2, certainty: "explicit" },
    ingredients: [
      { name: "Eggs", quantity: { value: 4, unit: "", certainty: "explicit" } },
      { name: "Salt", quantity: null, certainty: "unspecified" },
    ],
    equipment: [{ name: "Nonstick pan", certainty: "observed" }],
    steps: [
      { text: "Stir gently", duration: { seconds: 180, certainty: "explicit" } },
      { text: "Rest", duration_seconds: 60, duration_certainty: "estimated" },
    ],
  },
};

describe("backend recipe mapping", () => {
  const r = mapBackendRecipe(body, "https://youtu.be/x");
  it("keeps a stated quantity and its certainty", () => {
    expect(r.ingredients[0]).toMatchObject({ name: "Eggs", amount: 4, certainty: "explicit" });
  });
  it("never invents an amount for an unspecified ingredient", () => {
    expect(r.ingredients[1]).toMatchObject({ amount: null, certainty: "unspecified" });
  });
  it("keeps step durations with their evidence", () => {
    expect(r.steps[0]).toMatchObject({ durationSeconds: 180, durationCertainty: "explicit" });
    expect(r.steps[1]).toMatchObject({ durationSeconds: 60, durationCertainty: "estimated" });
  });
  it("links back to the submitted video", () => {
    expect(r.source.url).toBe("https://youtu.be/x");
  });
  it("rejects a response with no recipe", () => {
    expect(() => mapBackendRecipe({ recipe: { title: "x" } }, "u")).toThrow();
  });
});
