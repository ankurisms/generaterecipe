/**
 * Where creator concern / removal requests are sent.
 * The Creators page shows the request form whenever this is set.
 */
export const CREATOR_SUPPORT_EMAIL: string | null = "ankur9391@gmail.com";

export function buildCreatorRequestMailto(
  to: string,
  req: { videoUrl: string; concern: string; email: string },
) {
  const subject = "Creator concern / removal request";
  const body = `Original YouTube video URL:\n${req.videoUrl}\n\nConcern:\n${req.concern}\n\nContact email:\n${req.email}\n`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
