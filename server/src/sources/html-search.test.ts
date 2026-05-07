import { describe, expect, it } from "vitest";
import { normalizeHref } from "./html-search";

describe("normalizeHref", () => {
  it("converts relative source links to absolute urls", () => {
    expect(normalizeHref("/link?url=abc", "https://www.sogou.com")).toBe("https://www.sogou.com/link?url=abc");
  });

  it("keeps absolute urls unchanged", () => {
    expect(normalizeHref("https://example.com/a", "https://www.sogou.com")).toBe("https://example.com/a");
  });
});
