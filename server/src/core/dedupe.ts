import type { SourceItemCandidate } from "./types";

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function canonicalizeUrl(url: string): string {
  if (!url.trim()) return "";

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|spm|from|ref|source|fbclid|gclid)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

export function fingerprintItem(item: Pick<SourceItemCandidate, "title" | "url">): string {
  const canonicalUrl = canonicalizeUrl(item.url);
  if (canonicalUrl) return `url:${canonicalUrl}`;
  return `title:${normalizeTitle(item.title)}`;
}
