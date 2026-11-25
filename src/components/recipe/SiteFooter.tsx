import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>Recipe by GenerateRecipe</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/creators" className="hover:text-foreground hover:underline underline-offset-4">
            Respecting Creators
          </Link>
          <Link to="/creators" hash="contact" className="hover:text-foreground hover:underline underline-offset-4">
            Creator? Have a concern or removal request?
          </Link>
        </div>
      </div>
    </footer>
  );
}
