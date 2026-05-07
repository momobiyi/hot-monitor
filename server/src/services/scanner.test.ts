import { describe, expect, it, vi } from "vitest";
import { ScannerService } from "./scanner";

vi.mock("./openrouter", () => ({
  judgeWithAiProvider: async () => ({
    isRelevant: true,
    isAuthentic: true,
    isNew: true,
    confidence: 0.9,
    reason: "mock judgement",
    evidenceUrls: ["https://example.com/ai"],
    shouldNotify: true
  })
}));

describe("ScannerService", () => {
  it("does not crash when another scan already created a judgement", async () => {
    const prisma = {
      monitor: {
        findMany: async () => [
          {
            id: "monitor-1",
            query: "AI 编程",
            sources: JSON.stringify(["bing"])
          }
        ]
      },
      sourceItem: {
        upsert: async () => ({
          id: "source-item-1",
          title: "AI coding update",
          url: "https://example.com/ai",
          source: "bing",
          snippet: "new update"
        })
      },
      aiJudgement: {
        findUnique: async () => null,
        create: async () => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }
      },
      sourceHealth: {
        upsert: async () => ({})
      },
      hotspotEvent: {
        create: async () => {
          throw new Error("should not create an event for duplicate judgement races");
        }
      }
    };
    const scanner = new ScannerService(prisma as never);
    (scanner as never as { adapters: unknown[] }).adapters = [
      {
        name: "bing",
        search: async () => [
          {
            source: "bing",
            title: "AI coding update",
            url: "https://example.com/ai",
            snippet: "new update",
            raw: {}
          }
        ]
      }
    ];

    await expect(scanner.runOnce()).resolves.toEqual({ events: 0 });
  });
});
