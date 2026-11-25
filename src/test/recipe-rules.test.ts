import { describe, expect, it } from "vitest";

import { consolidateIngredients } from "@/lib/recipe/consolidate";
import { formatQuantity, hasEvidencedTimer } from "@/lib/recipe/format";
import type { Ingredient } from "@/lib/recipe/types";
import { validateVideoUrl } from "@/lib/recipe/validate-url";

describe("video link validation", () => {
  it("rejects an empty link", () => {
    expect(validateVideoUrl("   ")).toMatchObject({ ok: false, reason: "empty" });
  });

  it("rejects text that is not a link", () => {
    expect(validateVideoUrl("chilli noodles")).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("rejects links from other sites", () => {
    expect(validateVideoUrl("https://www.tiktok.com/@chef/video/123")).toMatchObject({
      ok: false,
      reason: "unsupported",
    });
  });

  it("rejects a YouTube channel page", () => {
    expect(validateVideoUrl("https://www.youtube.com/@somechef")).toMatchObject({ ok: false, reason: "unsupported" });
  });

  it("accepts YouTube videos, short links and Shorts", () => {
    expect(validateVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toMatchObject({ ok: true, platform: "youtube" });
    expect(validateVideoUrl("youtu.be/dQw4w9WgXcQ")).toMatchObject({ ok: true, platform: "youtube" });
    expect(validateVideoUrl("https://youtube.com/shorts/abc123")).toMatchObject({ ok: true, platform: "youtube" });
  });

  it("rejects Instagram links (YouTube only)", () => {
    expect(validateVideoUrl("https://www.instagram.com/reel/C8xNoodles10/")).toMatchObject({
      ok: false,
      reason: "unsupported",
    });
  });
});

describe("cook mode timers", () => {
  it("shows a timer for a duration stated in the video", () => {
    expect(hasEvidencedTimer({ id: "a", text: "", durationSeconds: 240, durationCertainty: "explicit" })).toBe(true);
  });

  it("shows a timer for a duration seen in the video", () => {
    expect(hasEvidencedTimer({ id: "a", text: "", durationSeconds: 30, durationCertainty: "observed" })).toBe(true);
  });

  it("hides the timer for an estimated duration", () => {
    expect(hasEvidencedTimer({ id: "a", text: "", durationSeconds: 120, durationCertainty: "estimated" })).toBe(false);
  });

  it("hides the timer when a step has no duration", () => {
    expect(hasEvidencedTimer({ id: "a", text: "" })).toBe(false);
  });
});

describe("ingredient quantities", () => {
  it("never invents an amount for an unspecified ingredient", () => {
    expect(formatQuantity({ amount: null, unit: "tsp" })).toBeNull();
  });

  const base = { group: "x" } as const;
  const ing = (p: Partial<Ingredient> & Pick<Ingredient, "id" | "name" | "amount" | "certainty">): Ingredient => ({
    ...base,
    ...p,
  });

  it("sums repeated ingredients with the same unit and certainty", () => {
    const [garlic] = consolidateIngredients([
      ing({ id: "1", name: "Garlic", amount: 4, unit: "cloves", certainty: "explicit" }),
      ing({ id: "2", name: "garlic", amount: 2, unit: "cloves", certainty: "explicit" }),
    ]);
    expect(garlic?.quantities).toEqual(["6 cloves"]);
  });

  it("keeps a missing amount visible instead of folding it into a total", () => {
    const [onion] = consolidateIngredients([
      ing({ id: "1", name: "Spring onions", amount: 3, unit: "stalks", certainty: "observed" }),
      ing({ id: "2", name: "Spring onions", amount: null, certainty: "unspecified" }),
    ]);
    expect(onion?.quantities).toEqual(["3 stalks", null]);
    expect(onion?.certainty).toBe("unspecified");
  });
});
