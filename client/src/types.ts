export type SourceName =
  | "twitter"
  | "bing"
  | "google"
  | "duckduckgo"
  | "hackernews"
  | "sogou"
  | "bilibili"
  | "weibo";

export interface Monitor {
  id: string;
  type: "keyword" | "topic";
  query: string;
  sources: SourceName[];
  intervalMinutes: number;
  enabled: boolean;
}

export interface HotspotEvent {
  id: string;
  title: string;
  url: string;
  source: SourceName;
  snippet: string;
  confidence: number;
  reason: string;
  evidenceUrls: string[];
  createdAt: string;
}

export interface SourceHealth {
  source: SourceName;
  status: "ok" | "error";
  lastCheckedAt: string;
  lastSuccessAt?: string;
  errorMessage?: string;
  itemCount: number;
}
