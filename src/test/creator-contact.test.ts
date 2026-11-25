import { describe, expect, it } from "vitest";

import { buildCreatorRequestMailto, CREATOR_SUPPORT_EMAIL } from "@/lib/creator-contact";

describe("creator support contact", () => {
  it("is configured, so the Creators page shows the request form", () => {
    expect(CREATOR_SUPPORT_EMAIL).toBe("ankur9391@gmail.com");
  });

  it("sends the request to the configured address with the details filled in", () => {
    const to = CREATOR_SUPPORT_EMAIL;
    expect(to).toBeTruthy();
    const mailto = buildCreatorRequestMailto(to as string, {
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      concern: "Please remove the recipe generated from my video.",
      email: "creator@example.com",
    });

    expect(mailto.startsWith(`mailto:${to}?`)).toBe(true);
    const encoded = mailto.match(/body=(.*)$/)?.[1] ?? "";
    const body = decodeURIComponent(encoded);
    expect(body).toContain("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(body).toContain("Please remove the recipe generated from my video.");
    expect(body).toContain("creator@example.com");
  });
});
