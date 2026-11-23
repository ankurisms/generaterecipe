import { useEffect } from "react";

/** Keeps the screen awake while mounted (where the browser supports it). */
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
          if (cancelled) void lock.release();
        }
      } catch {
        /* not allowed or unsupported */
      }
    };
    void request();
    const onVisible = () => void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, []);
}
