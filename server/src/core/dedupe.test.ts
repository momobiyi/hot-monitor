import { describe, expect, it } from "vitest";
import { fingerprintItem, normalizeTitle } from "./dedupe";

describe("dedupe", () => {
  it("normalizes title punctuation and whitespace for stable comparison", () => {
    expect(normalizeTitle("  OpenAI 发布 GPT-5！  ")).toBe("openai 发布 gpt 5");
  });

  it("uses canonical url over title when a url is present", () => {
    expect(
      fingerprintItem({
        source: "bing",
        title: "OpenAI ships model update",
        url: "https://example.com/news?id=1&utm_source=x",
        snippet: ""
      })
    ).toBe("url:https://example.com/news");
  });

  it("falls back to normalized title when url is missing", () => {
    expect(
      fingerprintItem({
        source: "google",
        title: "Claude Code 发布更新",
        url: "",
        snippet: ""
      })
    ).toBe("title:claude code 发布更新");
  });
});
