import type { SourceName } from "./types";

const SOURCE_BASE_URL: Partial<Record<SourceName, string>> = {
  sogou: "https://www.sogou.com",
  weibo: "https://s.weibo.com",
  bilibili: "https://search.bilibili.com",
  duckduckgo: "https://duckduckgo.com"
};

export function normalizeEventUrl(url: string, source: SourceName): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) {
    const baseUrl = SOURCE_BASE_URL[source];
    if (baseUrl) return new URL(url, baseUrl).toString();
  }
  return url;
}
