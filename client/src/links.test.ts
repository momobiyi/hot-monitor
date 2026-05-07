import { describe, expect, it } from "vitest";
import { normalizeEventUrl } from "./links";

describe("normalizeEventUrl", () => {
  it("converts source-relative event urls to external urls", () => {
    expect(normalizeEventUrl("/link?url=abc", "sogou")).toBe("https://www.sogou.com/link?url=abc");
  });

  it("keeps absolute event urls unchanged", () => {
    expect(normalizeEventUrl("https://example.com/a", "sogou")).toBe("https://example.com/a");
  });
});
