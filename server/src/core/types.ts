export const SOURCES = [
  "twitter",
  "bing",
  "google",
  "duckduckgo",
  "hackernews",
  "sogou",
  "bilibili",
  "weibo"
] as const;

export type SourceName = (typeof SOURCES)[number];

export type MonitorType = "keyword" | "topic";

export interface MonitorInput {
  type: MonitorType;
  query: string;
  sources: SourceName[];
  intervalMinutes: number;
  enabled: boolean;
}

export interface SourceItemCandidate {
  source: SourceName;
  title: string;
  url: string;
  snippet: string;
  author?: string;
  publishedAt?: Date;
  raw?: unknown;
}

export interface AiJudgementResult {
  isRelevant: boolean;
  isAuthentic: boolean;
  isNew: boolean;
  confidence: number;
  reason: string;
  evidenceUrls: string[];
  shouldNotify: boolean;
}
