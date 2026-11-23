import { ExternalLink, Instagram, Youtube } from "lucide-react";
import type { ReactNode } from "react";

import { CertaintyTag } from "./CertaintyTag";
import { formatMinutes, formatQuantity } from "@/lib/recipe/format";
import type { Equipment, Ingredient, Recipe, RecipeStep, SourcedValue } from "@/lib/recipe/types";
import { cn } from "@/lib/utils";

export function SectionHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
      <h2 className="font-display text-2xl font-medium text-foreground">{children}</h2>
      {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
    </div>
  );
}

export function SourceThumbnail({ recipe }: { recipe: Recipe }) {
  const { source } = recipe;
  const PlatformIcon = source.platform === "youtube" ? Youtube : Instagram;
  const platformLabel = source.platform === "youtube" ? "YouTube" : "Instagram Reel";
  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface">
      {source.thumbnailUrl ? (
        <img
          src={source.thumbnailUrl}
          alt={`Still from the source video for ${recipe.title}`}
          className="aspect-[16/11] w-full object-cover"
        />
      ) : (
        <div className="aspect-[16/11] w-full" />
      )}
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
          <PlatformIcon className="size-3.5" aria-hidden />
          {platformLabel}
          {source.author && <span className="text-muted-foreground">· {source.author}</span>}
        </span>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur hover:bg-background"
        >
          Original <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}

function MetaItem({
  label,
  item,
  format,
}: {
  label: string;
  item: SourcedValue<number>;
  format: (n: number) => string;
}) {
  const missing = item.value == null;
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-xl font-semibold tabular-nums text-foreground",
          missing && "text-base font-medium italic text-unspecified",
        )}
      >
        {missing ? "Not given" : `${item.certainty === "estimated" ? "≈ " : ""}${format(item.value!)}`}
      </dd>
      {item.certainty !== "explicit" && (
        <dd>
          <CertaintyTag certainty={item.certainty} />
        </dd>
      )}
    </div>
  );
}

export function RecipeMeta({ recipe }: { recipe: Recipe }) {
  return (
    <dl className="grid grid-cols-3 gap-4 border-y border-border py-5">
      <MetaItem label="Serves" item={recipe.servings} format={(n) => String(n)} />
      <MetaItem label="Prep" item={recipe.prepTime} format={formatMinutes} />
      <MetaItem label="Cook" item={recipe.cookTime} format={formatMinutes} />
    </dl>
  );
}

export function UncertaintySummary({ recipe }: { recipe: Recipe }) {
  const all = [...recipe.ingredients, ...recipe.equipment];
  const estimated = all.filter((i) => i.certainty === "estimated").length;
  const unspecified = all.filter((i) => i.certainty === "unspecified").length;
  if (!estimated && !unspecified) return null;
  const parts = [
    estimated && `${estimated} estimated`,
    unspecified && `${unspecified} not given in the video`,
  ].filter(Boolean);
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">Check before you cook:</span> {parts.join(" and ")}. They're
      marked below.
    </p>
  );
}

export function QuantityLabel({ ingredient, className }: { ingredient: Ingredient; className?: string }) {
  const qty = formatQuantity(ingredient);
  if (qty == null) {
    return <span className={cn("text-sm italic text-unspecified", className)}>Amount not given</span>;
  }
  return (
    <span className={cn("font-semibold tabular-nums text-foreground", className)}>
      {ingredient.certainty === "estimated" && <span aria-label="about">≈ </span>}
      {qty}
    </span>
  );
}

export function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  const groups = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    const g = ing.group ?? "";
    groups.set(g, [...(groups.get(g) ?? []), ing]);
  }
  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([group, items]) => (
        <div key={group || "all"}>
          {group && (
            <h3 className="pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</h3>
          )}
          <ul className="divide-y divide-border">
            {items.map((ing) => (
              <li key={ing.id} className="flex items-start justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-base font-medium text-foreground">{ing.name}</p>
                  {ing.preparation && <p className="text-sm text-muted-foreground">{ing.preparation}</p>}
                  {ing.certainty !== "explicit" && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <CertaintyTag certainty={ing.certainty} />
                      {ing.note && <span className="text-xs text-muted-foreground">{ing.note}</span>}
                    </div>
                  )}
                </div>
                <QuantityLabel ingredient={ing} className="shrink-0 pt-0.5 text-right" />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function EquipmentList({ equipment }: { equipment: Equipment[] }) {
  return (
    <ul className="divide-y divide-border">
      {equipment.map((e) => (
        <li key={e.id} className="flex items-start justify-between gap-4 py-3.5">
          <div className="min-w-0">
            <p className="text-base text-foreground">{e.name}</p>
            {e.note && <p className="mt-0.5 text-xs text-muted-foreground">{e.note}</p>}
          </div>
          {e.certainty !== "explicit" && <CertaintyTag certainty={e.certainty} />}
        </li>
      ))}
    </ul>
  );
}

export function MethodList({ steps }: { steps: RecipeStep[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((s, i) => (
        <li key={s.id} className="flex gap-4">
          <span className="w-6 shrink-0 font-display text-lg text-primary tabular-nums">{i + 1}</span>
          <p className="text-base leading-relaxed text-foreground">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function StickyCta({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
        {hint && <div className="hidden min-w-0 flex-1 text-sm text-muted-foreground sm:block">{hint}</div>}
        <div className="w-full sm:ml-auto sm:w-auto">{children}</div>
      </div>
    </div>
  );
}
