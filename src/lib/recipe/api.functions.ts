import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const DEFAULT_BACKEND_URL = "https://generaterecipe-backend.ankur9391.workers.dev";

export type ProcessResult =
  | { ok: true; json: string }
  | { ok: false; status: number; code: string; message: string; retryable: boolean };

/**
 * Forwards the request to the Cloudflare backend from the server. The backend
 * rejects browser (CORS) calls, so the browser never calls it directly.
 */
export const processRecipe = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        url: z.string().url().max(500),
        transcript: z.string().min(1).max(200_000),
        idempotencyKey: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<ProcessResult> => {
    const base = (import.meta.env["VITE_BACKEND_URL"] as string | undefined) || DEFAULT_BACKEND_URL;
    let res: Response;
    try {
      res = await fetch(`${base.replace(/\/$/, "")}/api/v1/recipes/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": data.idempotencyKey },
        body: JSON.stringify({ url: data.url, fallback_transcript: { text: data.transcript, language: null } }),
      });
    } catch {
      return { ok: false, status: 0, code: "NETWORK", message: "We couldn't reach the recipe service.", retryable: true };
    }
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON */
    }
    if (!res.ok) {
      const err = (body as { error?: { code?: string; message?: string; retryable?: boolean } } | null)?.error;
      return {
        ok: false,
        status: res.status,
        code: err?.code ?? `HTTP_${res.status}`,
        message: err?.message ?? `The recipe service returned an error (${res.status}).`,
        retryable: err?.retryable ?? res.status >= 500,
      };
    }
    return { ok: true, json: JSON.stringify(body) };
  });
