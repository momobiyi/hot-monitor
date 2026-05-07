import { config } from "../config";
import { buildJudgementPrompt, fallbackJudgement, parseAiJudgement } from "../core/ai";
import type { AiJudgementResult, SourceItemCandidate } from "../core/types";

export async function judgeWithAiProvider(item: SourceItemCandidate, query: string): Promise<AiJudgementResult> {
  if (config.aiProvider === "minimax") {
    return judgeWithMiniMax(item, query);
  }
  return judgeWithOpenRouter(item, query);
}

async function judgeWithOpenRouter(item: SourceItemCandidate, query: string): Promise<AiJudgementResult> {
  if (!config.openRouterApiKey) {
    return fallbackJudgement(item, query);
  }

  const response = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.openRouterApiKey}`,
      "content-type": "application/json",
      "HTTP-Referer": config.openRouterReferer,
      "X-OpenRouter-Title": config.openRouterTitle
    },
    body: JSON.stringify({
      model: config.openRouterModel,
      messages: [
        {
          role: "system",
          content: "You judge hotspot relevance and authenticity. Return strict JSON only."
        },
        { role: "user", content: buildJudgementPrompt(item, query, config.notifyConfidenceThreshold) }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter HTTP ${response.status}`);
  }

  const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned an empty response");
  return parseAiJudgement(content, config.notifyConfidenceThreshold);
}

async function judgeWithMiniMax(item: SourceItemCandidate, query: string): Promise<AiJudgementResult> {
  if (!config.minimaxApiKey) {
    return fallbackJudgement(item, query);
  }

  const response = await fetch(`${config.minimaxBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.minimaxApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.minimaxModel,
      messages: [
        {
          role: "system",
          name: "Hot Monitor",
          content: "You judge hotspot relevance and authenticity. Return strict JSON only."
        },
        {
          role: "user",
          name: "User",
          content: buildJudgementPrompt(item, query, config.notifyConfidenceThreshold)
        }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`MiniMax HTTP ${response.status}`);
  }

  const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("MiniMax returned an empty response");
  return parseAiJudgement(content, config.notifyConfidenceThreshold);
}
