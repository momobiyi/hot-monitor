import * as cheerio from "cheerio";
import type { SourceName } from "../core/types";
import type { SourceAdapter } from "./source-adapter";
import { fetchText, rssUrl } from "./source-adapter";

export class HtmlSearchAdapter implements SourceAdapter {
  constructor(
    public readonly name: SourceName,
    private readonly template: string,
    private readonly selector: string,
    private readonly linkSelector = "a",
    private readonly baseUrl?: string
  ) {}

  async search(query: string) {
    const html = await fetchText(rssUrl(this.template, query));
    const $ = cheerio.load(html);
    return $(this.selector)
      .toArray()
      .slice(0, 12)
      .map((node) => {
        const root = $(node);
        const link = root.find(this.linkSelector).first();
        const title = link.text().trim() || root.text().trim().split("\n")[0]?.trim();
        const href = root.find("[data-url]").first().attr("data-url") ?? root.attr("data-url") ?? link.attr("href") ?? "";
        const snippet = root.text().replace(/\s+/g, " ").trim();
        return {
          source: this.name,
          title,
          url: normalizeHref(href, this.baseUrl ?? this.template),
          snippet,
          raw: root.html()
        };
      })
      .filter((item) => item.title && item.url);
  }
}

export function normalizeHref(href: string, baseUrl: string): string {
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return new URL(href, baseUrl).toString();
  return href;
}
