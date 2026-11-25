import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Link2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { savePendingTranscript } from "@/lib/recipe/recipe-store";
import { validateVideoUrl } from "@/lib/recipe/validate-url";
import { cn } from "@/lib/utils";

export function UrlForm({ initialUrl = "", autoFocus = false }: { initialUrl?: string; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const tId = useId();
  const tErrId = useId();
  const tHelpId = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = validateVideoUrl(value);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    const text = transcript.trim();
    if (text.length < 40) {
      setTranscriptError(text ? "That transcript looks too short. Paste the full transcript." : "Paste the video's transcript to continue.");
      return;
    }
    setTranscriptError(null);
    // Kept in this tab's sessionStorage, never in the page address.
    savePendingTranscript(result.url, text);
    void navigate({ to: "/processing", search: { url: result.url } });
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor={inputId} className="sr-only">
        Video link
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border bg-card px-4 transition-colors focus-within:border-primary",
          error ? "border-destructive" : "border-input",
        )}
      >
        <Link2 className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="Paste a YouTube link"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      <p
        id={errorId}
        role="alert"
        className={cn("min-h-6 px-4 pt-1.5 text-sm text-destructive", !error && "invisible")}
      >
        {error ?? "\u00a0"}
      </p>
      <label htmlFor={tId} className="mt-1 block px-1 text-sm font-medium text-foreground">
        Video transcript
      </label>
      <p id={tHelpId} className="px-1 pt-1 text-sm leading-relaxed text-muted-foreground">
        On YouTube, open the video's description, choose "Show transcript", then copy and paste the text here.
      </p>
      <textarea
        id={tId}
        value={transcript}
        onChange={(e) => {
          setTranscript(e.target.value);
          if (transcriptError) setTranscriptError(null);
        }}
        rows={5}
        placeholder="Paste the transcript from YouTube"
        aria-invalid={!!transcriptError}
        aria-describedby={transcriptError ? `${tHelpId} ${tErrId}` : tHelpId}
        className={cn(
          "mt-2 block w-full resize-y rounded-2xl border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
          transcriptError ? "border-destructive" : "border-input",
        )}
      />
      <p
        id={tErrId}
        role="alert"
        className={cn("min-h-6 px-4 pt-1.5 text-sm text-destructive", !transcriptError && "invisible")}
      >
        {transcriptError ?? "\u00a0"}
      </p>
      <Button type="submit" size="xl" className="mt-1 w-full">
        Generate recipe
        <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}
