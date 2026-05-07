import * as cheerio from "cheerio";
import type { SourceName } from "../core/types";
import type { SourceAdapter } from "./source-adapter";
import { fetchText, rssUrl } from "./source-adapter";

export class RssAdapter implements SourceAdapter {
  constructor(
    public readonly name: SourceName,
    private readonly template: string
  ) {}

  async search(query: string) {
    const xml = await fetchText(rssUrl(this.template, query));
    const $ = cheerio.load(xml, { xmlMode: true });
    return $("item, entry")
      .toArray()
      .slice(0, 12)
      .map((node) => {
        const item = $(node);
        const title = item.find("title").first().text().trim();
        const link =
          item.find("link").first().attr("href") ?? item.find("link").first().text().trim();
        const snippet = item.find("description, summary, content").first().text().trim();
        const dateText = item.find("pubDate, published, updated").first().text().trim();
        const publishedAt = dateText ? new Date(dateText) : undefined;
        return {
          source: this.name,
          title,
          url: link,
          snippet,
          publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : undefined,
          raw: $.xml(node)
        };
      })
      .filter((item) => item.title && item.url);
  }
}
