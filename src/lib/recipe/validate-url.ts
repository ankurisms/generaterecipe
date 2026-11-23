import type { SourcePlatform } from "./types";

export type UrlValidationResult =
  | { ok: true; url: string; platform: SourcePlatform }
  | { ok: false; reason: "empty" | "invalid" | "unsupported"; message: string };

const YOUTUBE_HOSTS = ["youtube.com", "m.youtube.com", "www.youtube.com", "youtu.be"];
const INSTAGRAM_HOSTS = ["instagram.com", "www.instagram.com", "m.instagram.com"];

/** Validates a pasted video link. Only YouTube videos/Shorts and Instagram Reels/posts are supported. */
export function validateVideoUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty", message: "Paste a video link to continue." };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return invalid();
  }
  if (!parsed.hostname.includes(".") || /\s/.test(trimmed)) return invalid();

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  if (YOUTUBE_HOSTS.includes(host)) {
    const isVideo =
      (host === "youtu.be" && path.length > 1) ||
      (path === "/watch" && !!parsed.searchParams.get("v")) ||
      /^\/shorts\/[\w-]+/.test(path);
    return isVideo ? { ok: true, url: parsed.toString(), platform: "youtube" } : unsupportedPage();
  }

  if (INSTAGRAM_HOSTS.includes(host)) {
    const isReel = /^\/(reel|reels|p)\/[\w-]+/.test(path);
    return isReel ? { ok: true, url: parsed.toString(), platform: "instagram" } : unsupportedPage();
  }

  return {
    ok: false,
    reason: "unsupported",
    message: "We currently support YouTube and Instagram Reels links.",
  };
}

function invalid(): UrlValidationResult {
  return { ok: false, reason: "invalid", message: "That doesn't look like a valid link." };
}

function unsupportedPage(): UrlValidationResult {
  return {
    ok: false,
    reason: "unsupported",
    message: "Link to a specific video or Reel, not a profile or channel page.",
  };
}
