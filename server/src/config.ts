import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().default(4000),
  clientOrigin: z.string().default("http://127.0.0.1:5173"),
  scanIntervalMinutes: z.coerce.number().default(15),
  notifyConfidenceThreshold: z.coerce.number().min(0).max(1).default(0.8),
  aiProvider: z.enum(["openrouter", "minimax"]).default("openrouter"),
  openRouterApiKey: z.string().default(""),
  openRouterModel: z.string().default("openai/gpt-4.1-mini"),
  openRouterBaseUrl: z.string().default("https://openrouter.ai/api/v1"),
  openRouterTitle: z.string().default("Hot Monitor"),
  openRouterReferer: z.string().default("http://127.0.0.1:5173"),
  minimaxApiKey: z.string().default(""),
  minimaxModel: z.string().default("MiniMax-M2.7"),
  minimaxBaseUrl: z.string().default("https://api.minimax.io/v1"),
  twitterBearerToken: z.string().default("")
});

export const config = configSchema.parse({
  port: process.env.SERVER_PORT,
  clientOrigin: process.env.CLIENT_ORIGIN,
  scanIntervalMinutes: process.env.SCAN_INTERVAL_MINUTES,
  notifyConfidenceThreshold: process.env.NOTIFY_CONFIDENCE_THRESHOLD,
  aiProvider: process.env.AI_PROVIDER,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel: process.env.OPENROUTER_MODEL,
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL,
  openRouterTitle: process.env.OPENROUTER_APP_TITLE,
  openRouterReferer: process.env.OPENROUTER_REFERER,
  minimaxApiKey: process.env.MINIMAX_API_KEY,
  minimaxModel: process.env.MINIMAX_MODEL,
  minimaxBaseUrl: process.env.MINIMAX_BASE_URL,
  twitterBearerToken: process.env.TWITTER_BEARER_TOKEN
});
