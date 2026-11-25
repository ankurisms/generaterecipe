import { describe, expect, it, vi } from "vitest";

const { processRecipe } = vi.hoisted(() => ({ processRecipe: vi.fn() }));

vi.mock("@/lib/recipe/api.functions", () => ({
  processRecipe,
  DEFAULT_BACKEND_URL: "https://backend.test",
}));

import { apiRecipeService } from "@/lib/recipe/api-service";
import { savePendingTranscript } from "@/lib/recipe/recipe-store";
import { validateTranscript } from "@/lib/recipe/validate-transcript";

const URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("video transcript is optional", () => {
  it("accepts an empty transcript", () => {
    expect(validateTranscript("")).toEqual({ ok: true });
    expect(validateTranscript("   ")).toEqual({ ok: true });
  });

  it("flags a pasted transcript that is too short to be useful", () => {
    expect(validateTranscript("add garlic")).toMatchObject({ ok: false });
  });

  it("accepts a full transcript", () => {
    expect(validateTranscript("hey everyone, today we are making chilli garlic noodles at home")).toEqual({ ok: true });
  });

  it("sends the request with no transcript when none was pasted", async () => {
    processRecipe.mockResolvedValue({ ok: true, json: "{}" });
    window.sessionStorage.clear();

    await expect(apiRecipeService.extractRecipe(URL)).rejects.toMatchObject({ code: "no_recipe" });

    expect(processRecipe).toHaveBeenCalledTimes(1);
    expect(processRecipe.mock.calls[0]?.[0]).toMatchObject({ data: { url: URL, transcript: "" } });
  });

  it("does not reuse an older transcript when the new submission has none", async () => {
    processRecipe.mockResolvedValue({ ok: true, json: "{}" });
    window.sessionStorage.clear();
    savePendingTranscript(URL, "hey everyone, today we are making chilli garlic noodles at home");
    savePendingTranscript(URL, "");

    await expect(apiRecipeService.extractRecipe(URL)).rejects.toMatchObject({ code: "no_recipe" });

    expect(processRecipe.mock.calls[0]?.[0]).toMatchObject({ data: { transcript: "" } });
  });
});
