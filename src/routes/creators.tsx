import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { AppHeader } from "@/components/recipe/AppHeader";
import { SectionHeading } from "@/components/recipe/RecipeSections";
import { SiteFooter } from "@/components/recipe/SiteFooter";
import { Button } from "@/components/ui/button";
import { buildCreatorRequestMailto, CREATOR_SUPPORT_EMAIL } from "@/lib/creator-contact";
import { validateVideoUrl } from "@/lib/recipe/validate-url";

export const Route = createFileRoute("/creators")({
  head: () => ({
    meta: [
      { title: "Respecting Creators & Original Content — Recipe" },
      {
        name: "description",
        content: "How GenerateRecipe credits creators, and how creators can raise a concern or request removal.",
      },
      { property: "og:title", content: "Respecting Creators & Original Content — Recipe" },
      {
        property: "og:description",
        content: "How GenerateRecipe credits creators, and how creators can raise a concern or request removal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatorsPage,
});

const PRINCIPLES: [string, string][] = [
  ["Source attribution", "We aim to credit the original creator and link to the original video."],
  ["Respect for original content", "We do not claim ownership of creators' videos, audio or original work."],
  [
    "Recipe transformation",
    "We structure available cooking information into a practical recipe format rather than reproducing the original video or its presentation.",
  ],
  ["Creator preferences", "Creators can contact us if they have concerns about their content being processed."],
  [
    "Removal requests",
    "Creators can request review and removal or disabling of associated generated recipes where appropriate.",
  ],
];

function CreatorsPage() {
  return (
    <div className="min-h-dvh">
      <AppHeader
        right={
          <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground">
            <Link to="/">
              <Plus aria-hidden /> New recipe
            </Link>
          </Button>
        }
      />
      <main className="mx-auto w-full max-w-3xl space-y-12 px-5 pb-16 pt-6 sm:px-8">
        <section className="space-y-4">
          <h1 className="font-display text-[2rem] leading-tight font-medium text-foreground sm:text-4xl">
            Respecting Creators &amp; Original Content
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            GenerateRecipe makes cooking easier by transforming recipe-related video content into structured,
            easy-to-follow cooking instructions. We recognize and respect the creativity, effort and intellectual
            property of content creators. Our intention is to make recipes more accessible and practical, not to
            replace, reproduce or claim ownership of original work.
          </p>
        </section>

        <section aria-labelledby="principles">
          <SectionHeading>
            <span id="principles">Our principles</span>
          </SectionHeading>
          <ul className="divide-y divide-border">
            {PRINCIPLES.map(([title, body]) => (
              <li key={title} className="py-4">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            GenerateRecipe is an independent application and is not affiliated with, endorsed by or sponsored by
            YouTube or the creators whose content may be referenced.
          </p>
        </section>

        <section id="contact" aria-labelledby="contact-heading" className="scroll-mt-6">
          <SectionHeading>
            <span id="contact-heading">Creator? Have a concern or removal request?</span>
          </SectionHeading>
          <p className="pt-4 text-sm leading-relaxed text-muted-foreground">
            We aim to acknowledge requests within two business days and review them promptly.
          </p>
          <div className="pt-5">
            {CREATOR_SUPPORT_EMAIL ? <CreatorRequestForm to={CREATOR_SUPPORT_EMAIL} /> : <ContactPlaceholder />}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ContactPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-5 text-sm leading-relaxed">
      <p className="font-medium text-foreground">Support contact: [placeholder — not yet configured]</p>
      <p className="mt-2 text-muted-foreground">
        A creator support email hasn't been set up yet. Once it is, you'll be able to send your original YouTube
        video URL, a description of your concern and your contact email from here.
      </p>
    </div>
  );
}

function CreatorRequestForm({ to }: { to: string }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [concern, setConcern] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ids = { url: useId(), concern: useId(), email: useId() };

  function submit(e: FormEvent) {
    e.preventDefault();
    const check = validateVideoUrl(videoUrl);
    if (!check.ok) return setError("Enter the original YouTube video URL.");
    if (!concern.trim()) return setError("Describe your concern.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid contact email.");
    setError(null);
    window.location.href = buildCreatorRequestMailto(to, { videoUrl: check.url, concern: concern.trim(), email: email.trim() });
  }

  const field = "w-full rounded-2xl border border-input bg-card px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none";
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={ids.url} className="text-sm font-medium text-foreground">Original YouTube video URL</label>
        <input id={ids.url} type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={field} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={ids.concern} className="text-sm font-medium text-foreground">Description of the concern</label>
        <textarea id={ids.concern} rows={5} value={concern} onChange={(e) => setConcern(e.target.value)} className={field} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={ids.email} className="text-sm font-medium text-foreground">Contact email</label>
        <input id={ids.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg">Send request</Button>
      <p className="text-xs text-muted-foreground">This opens your email app with the details filled in, addressed to {to}.</p>
    </form>
  );
}
