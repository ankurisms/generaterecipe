import { Link } from "@tanstack/react-router";

import { AppHeader } from "./AppHeader";
import { Button } from "@/components/ui/button";

export function RecipeNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-24">
        <h1 className="font-display text-3xl font-medium text-foreground">This recipe isn't available</h1>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          The link may have expired. Paste the video again to generate a fresh recipe.
        </p>
        <Button asChild size="xl" className="mt-8">
          <Link to="/">Paste a video link</Link>
        </Button>
      </main>
    </div>
  );
}
