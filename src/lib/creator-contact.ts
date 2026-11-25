/**
 * Where creator concern / removal requests are sent.
 * PLACEHOLDER: no support address is configured yet. Set this to the real
 * support email to enable the request form on the Creators page.
 */
export const CREATOR_SUPPORT_EMAIL: string | null = null;

export function buildCreatorRequestMailto(
  to: string,
  req: { videoUrl: string; concern: string; email: string },
) {
  const subject = "Creator concern / removal request";
  const body = `Original YouTube video URL:\n${req.videoUrl}\n\nConcern:\n${req.concern}\n\nContact email:\n${req.email}\n`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
