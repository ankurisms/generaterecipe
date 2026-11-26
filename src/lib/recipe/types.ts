/**
 * Domain types for an extracted recipe. These mirror the shape a future
 * extraction API should return, so UI components never depend on mock data.
 */

/**
 * How a detail was obtained from the source video.
 * - explicit: said out loud or written on screen
 * - observed: seen in the video but not stated
 * - estimated: inferred by the extractor (e.g. typical amount)
 * - unspecified: the video does not give this detail
 */
export type Certainty = "explicit" | "observed" | "estimated" | "unspecified";

export type SourcePlatform = "youtube";

/** A single value with its provenance. `value` is null when unspecified. */
export interface SourcedValue<T> {
  value: T | null;
  certainty: Certainty;
  text?: string;
  note?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  /** Numeric amount, or null when the video never gives one. */
  amount: number | null;
  /** Literal quantity when the source gives a non-numeric amount such as "to taste". */
  amountText?: string;
  amountCertainty?: Certainty;
  /** Upper bound for ranges such as "2–3 cloves". */
  amountMax?: number;
  unit?: string;
  /** Free-text prep detail, e.g. "finely chopped". */
  preparation?: string;
  preparationCertainty?: Certainty;
  /** Grouping shown in the video, e.g. "Sauce". */
  group?: string;
  certainty: Certainty;
  note?: string;
}

export interface Equipment {
  id: string;
  name: string;
  certainty: Certainty;
  note?: string;
}

export interface RecipeStep {
  id: string;
  text: string;
  /** Duration in seconds, when the step has one. */
  durationSeconds?: number;
  /** How the duration was obtained. Required whenever durationSeconds is set. */
  durationCertainty?: Certainty;
  /** Literal duration when the source doesn't provide a numeric timer. */
  durationText?: string;
  certainty?: Certainty;
  tip?: string;
  /** Ingredient ids used in this step. */
  ingredientIds?: string[];
}

export interface RecipeSource {
  platform: SourcePlatform;
  /** Link to the original video; omitted when unavailable (e.g. the built-in sample). */
  url?: string;
  /** Original video title, when available. */
  videoTitle?: string;
  /** Creator / channel name, when available. */
  author?: string;
  thumbnailUrl?: string;
}

export interface Recipe {
  id: string;
  title: string;
  titleCertainty?: Certainty;
  description?: string;
  descriptionCertainty?: Certainty;
  source: RecipeSource;
  servings: SourcedValue<number>;
  /** Minutes. */
  prepTime: SourcedValue<number>;
  /** Minutes. */
  cookTime: SourcedValue<number>;
  ingredients: Ingredient[];
  equipment: Equipment[];
  steps: RecipeStep[];
  warnings?: string[];
}

export type ExtractionStage = "accessing" | "analysing" | "preparing";

export const EXTRACTION_STAGES: { id: ExtractionStage; label: string }[] = [
  { id: "accessing", label: "Accessing video" },
  { id: "analysing", label: "Analysing ingredients and instructions" },
  { id: "preparing", label: "Preparing your recipe" },
];

export type ExtractionErrorCode =
  | "unavailable"
  | "no_recipe"
  | "network"
  | "unsupported"
  | "transcript_required"
  | "invalid_transcript";

export class ExtractionError extends Error {
  code: ExtractionErrorCode;
  retryable: boolean;
  constructor(code: ExtractionErrorCode, message: string, retryable = code !== "unsupported") {
    super(message);
    this.name = "ExtractionError";
    this.code = code;
    this.retryable = retryable;
  }
}
