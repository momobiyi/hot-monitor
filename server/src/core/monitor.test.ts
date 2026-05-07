import { describe, expect, it } from "vitest";
import { isSameMonitorQuery, normalizeMonitorQuery } from "./monitor";

describe("monitor query normalization", () => {
  it("normalizes spacing and case for duplicate detection", () => {
    expect(normalizeMonitorQuery("  AI   Coding  ")).toBe("ai coding");
    expect(isSameMonitorQuery("AI Coding", " ai  coding ")).toBe(true);
  });
});
