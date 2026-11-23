import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Youtube } from "lucide-react";

import hero from "@/assets/hero-noodles.jpg.asset.json";
import { AppHeader } from "@/components/recipe/AppHeader";
import { UrlForm } from "@/components/recipe/UrlForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recipe — Turn recipe videos into recipes" },
      {
        name: "description",
        content:
          "Paste a YouTube or Instagram Reel cooking video. Get ingredients, instructions and a simple cooking experience.",
      },
      { property: "og:title", content: "Recipe — Turn recipe videos into recipes" },
      {
        property: "og:description",
        content: "Paste a cooking video. Get ingredients, instructions and a simple cooking experience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto grid w-full max-w-5xl gap-10 px-5 pb-16 pt-6 sm:px-8 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-14 md:pt-10">
        <section className="animate-fade-up">
          <h1 className="font-display text-[2.6rem] leading-[1.05] font-medium text-foreground sm:text-6xl md:text-5xl lg:text-[3.5rem]">
            Turn recipe videos into recipes.
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
            Paste a cooking video. Get ingredients, instructions and a simple cooking experience.
          </p>

          <div className="mt-8 max-w-md">
            <UrlForm />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>Works with</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Youtube className="size-4" aria-hidden /> YouTube
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Instagram className="size-4" aria-hidden /> Instagram Reels
            </span>
          </div>
        </section>

        <figure className="relative">
          <img
            src={hero.url}
            alt="A bowl of chilli garlic noodles with spring onions and sesame seeds"
            className="aspect-[4/3] w-full rounded-3xl object-cover md:aspect-[4/5]"
            width={1024}
            height={1536}
          />
          <figcaption className="sr-only">Example dish</figcaption>
        </figure>
      </main>

      <section className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        <ol className="grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
          {[
            ["Review", "Ingredients, amounts and equipment, with honest notes on what the video left out."],
            ["Prepare", "Tick off ingredients as you get them ready."],
            ["Cook", "One step at a time, in big type, with timers when the video gives one."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="font-display text-2xl text-primary">{i + 1}</span>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
