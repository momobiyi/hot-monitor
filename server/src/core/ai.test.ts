import { describe, expect, it } from "vitest";
import { parseAiJudgement, shouldNotify } from "./ai";

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
});
