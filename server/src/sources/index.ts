import { config } from "../config";
import { HtmlSearchAdapter } from "./html-search";
import { RssAdapter } from "./rss";
import type { SourceAdapter } from "./source-adapter";
import { TwitterAdapter } from "./twitter";

export function createAdapters(): SourceAdapter[] {
  return [
    new TwitterAdapter(config.twitterBearerToken),
    new RssAdapter("bing", "https://www.bing.com/news/search?q={query}&format=rss"),
    new RssAdapter("google", "https://news.google.com/rss/search?q={query}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans"),
    new RssAdapter("hackernews", "https://hnrss.org/newest?q={query}"),
    new HtmlSearchAdapter("duckduckgo", "https://duckduckgo.com/html/?q={query}", ".result", "a", "https://duckduckgo.com"),
    new HtmlSearchAdapter("sogou", "https://www.sogou.com/web?query={query}", ".vrwrap, .results .rb", "a", "https://www.sogou.com"),
    new HtmlSearchAdapter("bilibili", "https://search.bilibili.com/all?keyword={query}", ".bili-video-card, .video-item", "a", "https://search.bilibili.com"),
    new HtmlSearchAdapter("weibo", "https://s.weibo.com/weibo?q={query}", ".card-wrap", "a", "https://s.weibo.com")
  ];
}
