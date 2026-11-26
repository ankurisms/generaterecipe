import { beforeEach, describe, expect, it, vi } from "vitest";

const { processRecipe } = vi.hoisted(() => ({ processRecipe: vi.fn() }));

vi.mock("@/lib/recipe/api.functions", () => ({
  processRecipe,
  DEFAULT_BACKEND_URL: "https://backend.test",
}));

import { apiRecipeService } from "@/lib/recipe/api-service";
import { savePendingTranscript } from "@/lib/recipe/recipe-store";
import { validateTranscript } from "@/lib/recipe/validate-transcript";

const URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const IDEMPOTENCY_KEY = "3a0c0ec9-3c79-4c8f-83e4-73a521a950ad";

const recipeResponse = {
  api_version: "v1",
  recipe: {
    schema_version: "1.0.0",
    id: "recipe-from-transcript",
    title: { value: "Noodle soup", provenance: { kind: "explicit" } },
    description: { value: null, provenance: { kind: "not_specified" } },
    source: {
      platform: "youtube",
      original_url: URL,
      video_id: "dQw4w9WgXcQ",
      video_title: { value: "Soup", provenance: { kind: "observed" } },
      creator: { value: "Cook", provenance: { kind: "observed" } },
    },
    servings: { value: 2, provenance: { kind: "explicit" } },
    prep_time: {
      seconds: 300,
      text: "5 minutes",
      provenance: { kind: "explicit" },
    },
    cook_time: {
      seconds: 600,
      text: "10 minutes",
      provenance: { kind: "observed" },
    },
    total_time: { seconds: 900, text: "15 minutes", provenance: { kind: "explicit" } },
    equipment: [{ value: "Pot", provenance: { kind: "explicit" } }],
    ingredients: [
      {
        id: "noodles",
        name: "Noodles",
        quantity: {
          amount: null,
          amount_text: "to taste",
          unit: null,
          provenance: { kind: "explicit" },
        },
        preparation_notes: [],
        provenance: { kind: "explicit" },
      },
    ],
    instructions: [
      {
        step: 1,
        phase: "cooking",
        text: "Simmer the noodles.",
        duration: { seconds: null, text: "until tender", provenance: { kind: "observed" } },
        ingredient_ids: ["noodles"],
        provenance: { kind: "explicit" },
      },
    ],
    warnings: ["Check the noodles for doneness."],
    missing_information: [],
  },
};

beforeEach(() => {
  processRecipe.mockReset();
  window.sessionStorage.clear();
});

describe("video transcript is optional", () => {
  it("accepts an empty transcript", () => {
    expect(validateTranscript("")).toEqual({ ok: true });
    expect(validateTranscript("   ")).toEqual({ ok: true });
  });

  it("flags a pasted transcript that is too short to be useful", () => {
    expect(validateTranscript("add garlic")).toMatchObject({ ok: false });
  });

  it("accepts a full transcript", () => {
    expect(
      validateTranscript("hey everyone, today we are making chilli garlic noodles at home"),
    ).toEqual({ ok: true });
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

  it("surfaces TRANSCRIPT_REQUIRED without exposing the backend message", async () => {
    processRecipe.mockResolvedValue({
      ok: false,
      status: 422,
      code: "TRANSCRIPT_REQUIRED",
      message: "Internal provider detail",
      retryable: false,
    });

    const error = await apiRecipeService
      .extractRecipe(URL, { idempotencyKey: IDEMPOTENCY_KEY })
      .catch((value: unknown) => value);
    expect(error).toMatchObject({ code: "transcript_required" });
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("Copy it from YouTube");
    expect((error as Error).message).not.toContain("Internal provider detail");
    expect(processRecipe.mock.calls[0]?.[0]).toMatchObject({
      data: { url: URL, transcript: "", idempotencyKey: IDEMPOTENCY_KEY },
    });
  });

  it("retries with the same idempotency key and sends transcript text and language", async () => {
    processRecipe
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        code: "TRANSCRIPT_REQUIRED",
        message: "Transcript needed",
        retryable: false,
      })
      .mockResolvedValueOnce({ ok: true, json: JSON.stringify(recipeResponse) });

    await expect(
      apiRecipeService.extractRecipe(URL, { idempotencyKey: IDEMPOTENCY_KEY }),
    ).rejects.toMatchObject({
      code: "transcript_required",
    });
    await expect(
      apiRecipeService.extractRecipe(URL, {
        idempotencyKey: IDEMPOTENCY_KEY,
        transcript: "A full transcript for the noodle soup recipe that is long enough to use.",
        transcriptLanguage: "en",
      }),
    ).resolves.toEqual({ recipeId: "recipe-from-transcript" });
    await expect(apiRecipeService.getRecipe("recipe-from-transcript")).resolves.toMatchObject({
      title: "Noodle soup",
      titleCertainty: "explicit",
      ingredients: [{ amountText: "to taste", certainty: "explicit" }],
      steps: [{ durationText: "until tender", durationCertainty: "observed" }],
      warnings: ["Check the noodles for doneness."],
    });

    expect(processRecipe.mock.calls.map(([request]) => request)).toEqual([
      {
        data: {
          url: URL,
          transcript: "",
          transcriptLanguage: null,
          idempotencyKey: IDEMPOTENCY_KEY,
        },
      },
      {
        data: {
          url: URL,
          transcript: "A full transcript for the noodle soup recipe that is long enough to use.",
          transcriptLanguage: "en",
          idempotencyKey: IDEMPOTENCY_KEY,
        },
      },
    ]);
  });
});
