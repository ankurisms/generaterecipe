import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { AppHeader } from "@/components/recipe/AppHeader";
import { ProgressBar } from "@/components/recipe/ProgressBar";
import { Button } from "@/components/ui/button";
import { recipeService } from "@/lib/recipe/service";
import { EXTRACTION_STAGES, ExtractionError, type ExtractionStage } from "@/lib/recipe/types";
import { savePendingTranscript } from "@/lib/recipe/recipe-store";
import { validateTranscript } from "@/lib/recipe/validate-transcript";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing")({
  validateSearch: (search: Record<string, unknown>): { url: string } => ({
    url: typeof search["url"] === "string" ? search["url"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Generating your recipe — Recipe" },
      {
        name: "description",
        content: "Reading the cooking video and extracting ingredients and steps.",
      },
      { property: "og:title", content: "Generating your recipe — Recipe" },
      {
        property: "og:description",
        content: "Reading the cooking video and extracting ingredients and steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Processing,
});

type State =
  | { status: "running"; stage: ExtractionStage }
  | {
      status: "error";
      stage: ExtractionStage;
      message: string;
      retryable: boolean;
      requiresTranscript: boolean;
    };

function Processing() {
  const { url } = Route.useSearch();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [transcriptSubmission, setTranscriptSubmission] = useState<{
    text: string;
    language: string;
  } | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptLanguage, setTranscriptLanguage] = useState("en");
  const [transcriptValidation, setTranscriptValidation] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: "running", stage: "accessing" });
  const transcriptId = useId();
  const languageId = useId();
  const transcriptRequest = useRef<{ url: string; key: string } | null>(null);
  if (transcriptRequest.current?.url !== url) {
    transcriptRequest.current = { url, key: crypto.randomUUID() };
  }
  const requestKey = transcriptRequest.current.key;

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "running", stage: "accessing" });
    let current: ExtractionStage = "accessing";

    recipeService
      .extractRecipe(url, {
        signal: controller.signal,
        idempotencyKey: requestKey,
        ...(transcriptSubmission
          ? {
              transcript: transcriptSubmission.text,
              transcriptLanguage: transcriptSubmission.language,
            }
          : {}),
        onStage: (stage) => {
          current = stage;
          setState({ status: "running", stage });
        },
      })
      .then(({ recipeId }) => {
        if (controller.signal.aborted) return;
        void navigate({ to: "/recipe/$recipeId", params: { recipeId }, replace: true });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const isKnown = err instanceof ExtractionError;
        setState({
          status: "error",
          stage: current,
          message: isKnown ? err.message : "Something went wrong while reading the video.",
          retryable: !isKnown || err.retryable,
          requiresTranscript:
            isKnown && (err.code === "transcript_required" || err.code === "invalid_transcript"),
        });
      });

    return () => controller.abort();
  }, [url, attempt, navigate, requestKey, transcriptSubmission]);

  function submitTranscript(event: FormEvent) {
    event.preventDefault();
    const text = transcriptText.trim();
    if (!text) {
      setTranscriptValidation("Paste the transcript from YouTube to continue.");
      return;
    }
    const check = validateTranscript(text);
    if (!check.ok) {
      setTranscriptValidation(check.message);
      return;
    }
    setTranscriptValidation(null);
    savePendingTranscript(url, text);
    setTranscriptSubmission({ text, language: transcriptLanguage.trim() });
  }

  const stageIndex = EXTRACTION_STAGES.findIndex((s) => s.id === state.stage);
  const progress = state.status === "error" ? (stageIndex + 0.5) / 3 : (stageIndex + 0.6) / 3;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-24">
        {state.status === "running" ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">Working on it</p>
            <h1 className="mt-1 font-display text-3xl font-medium text-foreground">
              Reading your video
            </h1>
            <p className="mt-2 truncate text-sm text-muted-foreground" title={url}>
              {url}
            </p>
          </>
        ) : (
          <div role="alert" className="animate-fade-up">
            <AlertCircle className="size-8 text-destructive" aria-hidden />
            <h1 className="mt-3 font-display text-3xl font-medium text-foreground">
              We couldn't make a recipe
            </h1>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{state.message}</p>
          </div>
        )}

        <ProgressBar
          value={progress}
          label="Recipe generation progress"
          className={cn("mt-8", state.status === "error" && "[&>div]:bg-destructive")}
        />

        {state.status === "error" && state.requiresTranscript && (
          <form onSubmit={submitTranscript} noValidate className="mt-8 space-y-3">
            <label htmlFor={transcriptId} className="block text-sm font-medium text-foreground">
              Paste the YouTube transcript
            </label>
            <p className="text-sm leading-relaxed text-muted-foreground">
              On YouTube, open the video description, choose “Show transcript,” then copy and paste
              the transcript below. The video link is unchanged.
            </p>
            <textarea
              id={transcriptId}
              rows={7}
              value={transcriptText}
              onChange={(event) => {
                setTranscriptText(event.target.value);
                if (transcriptValidation) setTranscriptValidation(null);
              }}
              aria-invalid={Boolean(transcriptValidation)}
              aria-describedby={transcriptValidation ? `${transcriptId}-error` : undefined}
              className={cn(
                "block w-full resize-y rounded-2xl border bg-card px-4 py-3 text-base text-foreground focus:outline-none",
                transcriptValidation ? "border-destructive" : "border-input focus:border-primary",
              )}
              placeholder="Paste the copied transcript here"
            />
            {transcriptValidation && (
              <p id={`${transcriptId}-error`} role="alert" className="text-sm text-destructive">
                {transcriptValidation}
              </p>
            )}
            <div className="space-y-1">
              <label htmlFor={languageId} className="block text-sm font-medium text-foreground">
                Transcript language
              </label>
              <input
                id={languageId}
                value={transcriptLanguage}
                onChange={(event) => setTranscriptLanguage(event.target.value)}
                maxLength={64}
                placeholder="en"
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground">
                Use a language code such as “en” or “es”.
              </p>
            </div>
            <Button type="submit" size="xl" className="w-full">
              Generate recipe from transcript
            </Button>
          </form>
        )}

        <ol className="mt-6 space-y-4" aria-live="polite">
          {EXTRACTION_STAGES.map((s, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            const failed = active && state.status === "error";
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-xs",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && !failed && "border-primary text-primary",
                    failed && "border-destructive text-destructive",
                    !done && !active && "border-border text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {done ? (
                    <Check className="size-4" />
                  ) : failed ? (
                    <AlertCircle className="size-4" />
                  ) : active ? (
                    <span className="size-2 rounded-full bg-primary animate-stage-pulse" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-base",
                    done && "text-muted-foreground",
                    active && "font-medium text-foreground",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {s.label}
                  {done && <span className="sr-only"> — done</span>}
                  {failed && <span className="sr-only"> — failed</span>}
                </span>
              </li>
            );
          })}
        </ol>

        {state.status === "error" && (
          <div className="mt-10 flex flex-col gap-3">
            {state.retryable && (
              <Button size="xl" onClick={() => setAttempt((a) => a + 1)}>
                <RotateCcw aria-hidden />
                Try again
              </Button>
            )}
            <Button asChild size="xl" variant="outline" className="bg-transparent">
              <Link to="/">Use a different link</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
