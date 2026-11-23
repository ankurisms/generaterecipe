import { useCallback, useSyncExternalStore } from "react";

/** Per-recipe cooking progress kept in sessionStorage for the current tab. */
export interface RecipeProgress {
  ready: string[];
  completedSteps: string[];
}

const EMPTY: RecipeProgress = { ready: [], completedSteps: [] };
const cache = new Map<string, RecipeProgress>();
const listeners = new Set<() => void>();

const storageKey = (recipeId: string) => `recipe-progress:${recipeId}`;

function read(recipeId: string): RecipeProgress {
  const cached = cache.get(recipeId);
  if (cached) return cached;
  let value = EMPTY;
  try {
    const raw = sessionStorage.getItem(storageKey(recipeId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RecipeProgress>;
      value = {
        ready: Array.isArray(parsed.ready) ? parsed.ready : [],
        completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
      };
    }
  } catch {
    value = EMPTY;
  }
  cache.set(recipeId, value);
  return value;
}

function write(recipeId: string, next: RecipeProgress) {
  cache.set(recipeId, next);
  try {
    sessionStorage.setItem(storageKey(recipeId), JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function toggle(list: string[], id: string, on?: boolean) {
  const has = list.includes(id);
  const shouldHave = on ?? !has;
  if (shouldHave === has) return list;
  return shouldHave ? [...list, id] : list.filter((x) => x !== id);
}

export function useRecipeProgress(recipeId: string) {
  const progress = useSyncExternalStore(
    subscribe,
    () => read(recipeId),
    () => EMPTY,
  );

  const toggleReady = useCallback(
    (key: string) => {
      const cur = read(recipeId);
      write(recipeId, { ...cur, ready: toggle(cur.ready, key) });
    },
    [recipeId],
  );

  const setStepComplete = useCallback(
    (stepId: string, done?: boolean) => {
      const cur = read(recipeId);
      write(recipeId, { ...cur, completedSteps: toggle(cur.completedSteps, stepId, done) });
    },
    [recipeId],
  );

  const resetSteps = useCallback(() => {
    write(recipeId, { ...read(recipeId), completedSteps: [] });
  }, [recipeId]);

  return { progress, toggleReady, setStepComplete, resetSteps };
}
