/** A transcript can be supplied later if the backend can't process the video without one. */
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
