import { describe, expect, it } from "vitest";
import { buildJudgementPrompt, fallbackJudgement, parseAiJudgement, shouldNotify } from "./ai";

describe("ai judgement", () => {
  it("parses fenced json returned by a chat model", () => {
    const result = parseAiJudgement(`
      \`\`\`json
      {
        "isRelevant": true,
        "isAuthentic": true,
        "isNew": true,
        "confidence": 0.91,
        "reason": "Multiple sources point to the same release.",
        "evidenceUrls": ["https://example.com"],
        "shouldNotify": true
      }
      \`\`\`
    `);

    expect(result.shouldNotify).toBe(true);
    expect(result.evidenceUrls).toEqual(["https://example.com"]);
  });

  it("enforces high confidence notification threshold", () => {
    expect(
      shouldNotify(
        {
          isRelevant: true,
          isAuthentic: true,
          isNew: true,
          confidence: 0.79,
          reason: "Almost there",
          evidenceUrls: [],
          shouldNotify: true
        },
        0.8
      )
    ).toBe(false);
  });

  it("allows a lower configured notification threshold", () => {
    expect(
      shouldNotify(
        {
          isRelevant: true,
          isAuthentic: true,
          isNew: true,
          confidence: 0.82,
          reason: "Relevant enough",
          evidenceUrls: [],
          shouldNotify: false
        },
        0.8
      )
    ).toBe(true);
  });

  it("parses json after model reasoning text", () => {
    const result = parseAiJudgement(`<think>checking sources</think>
      {
        "isRelevant": true,
        "isAuthentic": true,
        "isNew": true,
        "confidence": 0.95,
        "reason": "Official and fresh.",
        "evidenceUrls": ["https://example.com"],
        "shouldNotify": true
      }`);

    expect(result.shouldNotify).toBe(true);
    expect(result.confidence).toBe(0.95);
  });

  it("requires the model reason to be written in Chinese", () => {
    const prompt = buildJudgementPrompt(
      {
        source: "bing",
        title: "OpenAI ships a model update",
        snippet: "A new model update is available.",
        url: "https://example.com",
        publishedAt: new Date("2026-05-08T00:00:00.000Z")
      },
      "AI 大模型"
    );

    expect(prompt).toContain("reason");
    expect(prompt).toContain("中文");
  });

  it("returns Chinese fallback reasons when the provider is unavailable", () => {
    const result = fallbackJudgement(
      {
        source: "bing",
        title: "AI 大模型更新",
        snippet: "OpenAI 发布模型更新",
        url: "https://example.com",
        publishedAt: new Date("2026-05-08T00:00:00.000Z")
      },
      "AI 大模型"
    );

    expect(result.reason).toMatch(/[\u4e00-\u9fff]/);
  });
});
