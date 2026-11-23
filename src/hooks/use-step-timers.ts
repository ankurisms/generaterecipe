import { useCallback, useEffect, useRef, useState } from "react";

interface TimerEntry {
  durationMs: number;
  /** Remaining time when paused. */
  remainingMs: number;
  /** Timestamp when the timer will hit zero, set while running. */
  endsAt: number | null;
}

export interface TimerView {
  remainingMs: number;
  running: boolean;
  done: boolean;
  started: boolean;
}

/** Countdown timers keyed by step id, so a timer keeps running while the cook moves between steps. */
export function useStepTimers(onFinish?: (id: string) => void) {
  const [timers, setTimers] = useState<Record<string, TimerEntry>>({});
  const [now, setNow] = useState(() => Date.now());
  const finished = useRef(new Set<string>());
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const anyRunning = Object.values(timers).some((t) => t.endsAt !== null);

  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [anyRunning]);

  useEffect(() => {
    for (const [id, t] of Object.entries(timers)) {
      if (t.endsAt !== null && t.endsAt <= now && !finished.current.has(id)) {
        finished.current.add(id);
        setTimers((prev) => {
          const cur = prev[id];
          return cur ? { ...prev, [id]: { ...cur, remainingMs: 0, endsAt: null } } : prev;
        });
        onFinishRef.current?.(id);
      }
    }
  }, [now, timers]);

  const get = useCallback(
    (id: string, durationMs: number): TimerView => {
      const t = timers[id];
      if (!t) return { remainingMs: durationMs, running: false, done: false, started: false };
      const remainingMs = t.endsAt !== null ? Math.max(0, t.endsAt - now) : t.remainingMs;
      return { remainingMs, running: t.endsAt !== null && remainingMs > 0, done: remainingMs <= 0, started: true };
    },
    [timers, now],
  );

  const start = useCallback((id: string, durationMs: number) => {
    finished.current.delete(id);
    const n = Date.now();
    setNow(n);
    setTimers((prev) => {
      const cur = prev[id];
      const remaining = cur && cur.remainingMs > 0 ? cur.remainingMs : durationMs;
      return { ...prev, [id]: { durationMs, remainingMs: remaining, endsAt: n + remaining } };
    });
  }, []);

  const pause = useCallback((id: string) => {
    const n = Date.now();
    setTimers((prev) => {
      const cur = prev[id];
      if (!cur || cur.endsAt === null) return prev;
      return { ...prev, [id]: { ...cur, remainingMs: Math.max(0, cur.endsAt - n), endsAt: null } };
    });
  }, []);

  const reset = useCallback((id: string) => {
    finished.current.delete(id);
    setTimers((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /** Ids of timers that are running or have finished but not been reset. */
  const activeIds = Object.entries(timers)
    .filter(([, t]) => t.endsAt !== null || t.remainingMs === 0)
    .map(([id]) => id);

  return { get, start, pause, reset, activeIds };
}

/** Short chime + vibration when a timer finishes. Fails silently where unsupported. */
export function alertTimerDone() {
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* ignore */
  }
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.22);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* ignore */
  }
}
