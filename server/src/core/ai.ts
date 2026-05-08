import { z } from "zod";
import type { AiJudgementResult, SourceItemCandidate } from "./types";

const judgementSchema = z.object({
  isRelevant: z.boolean(),
  isAuthentic: z.boolean(),
  isNew: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  evidenceUrls: z.array(z.string()).default([]),
  shouldNotify: z.boolean()
});

export function shouldNotify(result: AiJudgementResult, threshold = 0.8): boolean {
  return result.isRelevant && result.isAuthentic && result.isNew && result.confidence >= threshold;
}

export function parseAiJudgement(content: string, threshold = 0.8): AiJudgementResult {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fenced?.[1] ?? extractJsonObject(trimmed);
  const parsed = judgementSchema.parse(JSON.parse(jsonText));
  return { ...parsed, shouldNotify: shouldNotify(parsed, threshold) };
}

function extractJsonObject(content: string): string {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return content.slice(start, end + 1);
  }
  return content;
}

export function fallbackJudgement(item: SourceItemCandidate, query: string): AiJudgementResult {
  const haystack = `${item.title} ${item.snippet}`.toLowerCase();
  const relevant = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .some((token) => haystack.includes(token));

  const confidence = relevant ? 0.72 : 0.2;
  return {
    isRelevant: relevant,
    isAuthentic: Boolean(item.url),
    isNew: true,
    confidence,
    reason: relevant
      ? "AI 服务未配置，本地兜底判断认为该内容与监控主题相关，但置信度低于通知阈值。"
      : "AI 服务未配置，本地兜底判断认为该内容与监控主题匹配度不足。",
    evidenceUrls: item.url ? [item.url] : [],
    shouldNotify: false
  };
}

export function buildJudgementPrompt(item: SourceItemCandidate, query: string, threshold = 0.8): string {
  return [
    "You are a news authenticity and relevance judge for a lightweight hotspot monitor.",
    "Return strict JSON only with keys: isRelevant, isAuthentic, isNew, confidence, reason, evidenceUrls, shouldNotify.",
    "The reason field must be written in Chinese (中文).",
    `Set shouldNotify true when confidence is at least ${threshold} and the item is relevant, authentic, and new.`,
    `Monitor query: ${query}`,
    `Source: ${item.source}`,
    `Title: ${item.title}`,
    `Snippet: ${item.snippet}`,
    `URL: ${item.url}`,
    `Published at: ${item.publishedAt?.toISOString() ?? "unknown"}`
  ].join("\n");
}
