/**
 * The transcript is optional: the backend can read the video itself, and the
 * pasted text is only a fallback. A pasted transcript still has to be usable.
 */
export type TranscriptCheck = { ok: true } | { ok: false; message: string };

const MIN_USEFUL_LENGTH = 40;

export function validateTranscript(text: string): TranscriptCheck {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true };
  if (trimmed.length < MIN_USEFUL_LENGTH) {
    return { ok: false, message: "That transcript looks too short. Paste the full transcript." };
  }
  return { ok: true };
}
