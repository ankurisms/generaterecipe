import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Link2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { validateVideoUrl } from "@/lib/recipe/validate-url";
import { cn } from "@/lib/utils";

export const EXAMPLE_URL = "https://www.instagram.com/reel/C8xNoodles10/";

export function UrlForm({ initialUrl = "", autoFocus = false }: { initialUrl?: string; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = validateVideoUrl(value);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
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
          placeholder="Paste a YouTube or Reel link"
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
      <Button type="submit" size="xl" className="mt-1 w-full">
        Generate recipe
        <ArrowRight aria-hidden />
      </Button>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        No link handy?{" "}
        <button
          type="button"
          onClick={() => {
            setValue(EXAMPLE_URL);
            setError(null);
          }}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Try an example
        </button>
      </p>
    </form>
  );
}
