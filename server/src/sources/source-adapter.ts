import type { SourceItemCandidate } from "../core/types";

export interface SourceAdapter {
  name: SourceItemCandidate["source"];
  search(query: string): Promise<SourceItemCandidate[]>;
}

export function rssUrl(url: string, query: string): string {
  return url.replace("{query}", encodeURIComponent(query));
}

export async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "HotMonitor/0.1 (+local tool)",
        accept: "application/rss+xml,application/xml,text/html,application/json",
        ...init?.headers
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 10000ms");
    }
    const cause = error instanceof Error ? error.cause : undefined;
    if (cause && typeof cause === "object" && "code" in cause) {
      throw new Error(`${error instanceof Error ? error.message : "fetch failed"} (${String(cause.code)})`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
