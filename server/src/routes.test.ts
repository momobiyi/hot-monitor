import { describe, expect, it } from "vitest";
import { monitorInputSchema } from "./validation";

describe("monitor validation", () => {
  it("defaults monitor configuration for a lightweight local setup", () => {
    const input = monitorInputSchema.parse({ query: "AI 编程" });
    expect(input.intervalMinutes).toBe(15);
    expect(input.enabled).toBe(true);
    expect(input.sources).toContain("bing");
  });

  it("rejects empty queries", () => {
    expect(() => monitorInputSchema.parse({ query: " " })).toThrow();
  });
});
