import type { SourceAdapter } from "./source-adapter";

export class TwitterAdapter implements SourceAdapter {
  readonly name = "twitter" as const;

  constructor(private readonly bearerToken: string) {}

  async search(query: string) {
    if (!this.bearerToken) {
      throw new Error("TWITTER_BEARER_TOKEN is not configured");
    }
    const params = new URLSearchParams({
      query,
      max_results: "10",
      "tweet.fields": "created_at,author_id"
    });
    const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
      headers: { authorization: `Bearer ${this.bearerToken}` }
    });
    if (!response.ok) {
      throw new Error(`Twitter API HTTP ${response.status}`);
    }
    const json = (await response.json()) as {
      data?: Array<{ id: string; text: string; created_at?: string; author_id?: string }>;
    };
    return (json.data ?? []).map((tweet) => ({
      source: this.name,
      title: tweet.text.slice(0, 120),
      url: `https://twitter.com/i/web/status/${tweet.id}`,
      snippet: tweet.text,
      author: tweet.author_id,
      publishedAt: tweet.created_at ? new Date(tweet.created_at) : undefined,
      raw: tweet
    }));
  }
}
