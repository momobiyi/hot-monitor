import type { PrismaClient } from "@prisma/client";
import type { Server as SocketServer } from "socket.io";
import { config } from "../config";
import { fallbackJudgement, shouldNotify } from "../core/ai";
import { fingerprintItem } from "../core/dedupe";
import type { SourceItemCandidate, SourceName } from "../core/types";
import { createAdapters } from "../sources";
import { judgeWithAiProvider } from "./openrouter";

export class ScannerService {
  private readonly adapters = createAdapters();

  constructor(
    private readonly prisma: PrismaClient,
    private io?: SocketServer
  ) {}

  setSocketServer(io: SocketServer) {
    this.io = io;
  }

  async runOnce() {
    this.io?.emit("scan:started", { at: new Date().toISOString() });
    const monitors = await this.prisma.monitor.findMany({ where: { enabled: true } });
    const events = [];

    for (const monitor of monitors) {
      const selectedSources = JSON.parse(monitor.sources) as SourceName[];
      for (const adapter of this.adapters.filter((candidate) => selectedSources.includes(candidate.name))) {
        let items: SourceItemCandidate[] = [];
        try {
          items = await adapter.search(monitor.query);
          await this.markSourceSuccess(adapter.name, items.length);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await this.markSourceError(adapter.name, message);
          this.io?.emit("source:error", { source: adapter.name, message });
          continue;
        }

        for (const item of items) {
          const fingerprint = fingerprintItem(item);
          const sourceItem = await this.prisma.sourceItem.upsert({
            where: { monitorId_fingerprint: { monitorId: monitor.id, fingerprint } },
            create: {
              monitorId: monitor.id,
              source: item.source,
              title: item.title,
              url: item.url,
              snippet: item.snippet,
              author: item.author,
              publishedAt: item.publishedAt,
              fingerprint,
              raw: JSON.stringify(item.raw ?? item)
            },
            update: {
              snippet: item.snippet,
              publishedAt: item.publishedAt,
              raw: JSON.stringify(item.raw ?? item)
            }
          });

          const existingJudgement = await this.prisma.aiJudgement.findUnique({
            where: { sourceItemId: sourceItem.id }
          });
          if (existingJudgement) continue;

          let judgement;
          try {
            judgement = await judgeWithAiProvider(item, monitor.query);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            judgement = {
              ...fallbackJudgement(item, monitor.query),
              reason: `AI judgement failed: ${message}`,
              shouldNotify: false
            };
          }

          let savedJudgement;
          try {
            savedJudgement = await this.prisma.aiJudgement.create({
              data: {
                sourceItemId: sourceItem.id,
                isRelevant: judgement.isRelevant,
                isAuthentic: judgement.isAuthentic,
                isNew: judgement.isNew,
                confidence: judgement.confidence,
                reason: judgement.reason,
                evidenceUrls: JSON.stringify(judgement.evidenceUrls),
                shouldNotify: judgement.shouldNotify,
                raw: JSON.stringify(judgement)
              }
            });
          } catch (error) {
            if (isUniqueConstraintError(error)) continue;
            throw error;
          }

          if (shouldNotify(judgement, config.notifyConfidenceThreshold)) {
            const event = await this.prisma.hotspotEvent.create({
              data: {
                monitorId: monitor.id,
                aiJudgementId: savedJudgement.id,
                title: sourceItem.title,
                url: sourceItem.url,
                source: sourceItem.source,
                snippet: sourceItem.snippet,
                confidence: savedJudgement.confidence,
                reason: savedJudgement.reason,
                evidenceUrls: savedJudgement.evidenceUrls,
                notifiedAt: new Date()
              }
            });
            this.io?.emit("hotspot:new", event);
            events.push(event);
          }
        }
      }
    }

    this.io?.emit("scan:finished", { at: new Date().toISOString(), events: events.length });
    return { events: events.length };
  }

  private async markSourceSuccess(source: string, itemCount: number) {
    await this.prisma.sourceHealth.upsert({
      where: { source },
      create: {
        source,
        status: "ok",
        lastCheckedAt: new Date(),
        lastSuccessAt: new Date(),
        itemCount
      },
      update: {
        status: "ok",
        lastCheckedAt: new Date(),
        lastSuccessAt: new Date(),
        itemCount,
        errorMessage: null
      }
    });
  }

  private async markSourceError(source: string, errorMessage: string) {
    await this.prisma.sourceHealth.upsert({
      where: { source },
      create: {
        source,
        status: "error",
        lastCheckedAt: new Date(),
        errorMessage
      },
      update: {
        status: "error",
        lastCheckedAt: new Date(),
        errorMessage
      }
    });
  }
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
