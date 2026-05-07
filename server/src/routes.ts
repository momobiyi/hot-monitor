import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { SOURCES } from "./core/types";
import { isSameMonitorQuery } from "./core/monitor";
import type { ScannerService } from "./services/scanner";
import { monitorInputSchema, monitorPatchSchema } from "./validation";

export function createRouter(prisma: PrismaClient, scanner: ScannerService) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true, sources: SOURCES });
  });

  router.get("/monitors", async (_req, res, next) => {
    try {
      const monitors = await prisma.monitor.findMany({ orderBy: { createdAt: "desc" } });
      res.json(monitors.map(toMonitorDto));
    } catch (error) {
      next(error);
    }
  });

  router.post("/monitors", async (req, res, next) => {
    try {
      const input = monitorInputSchema.parse(req.body);
      const existingMonitors = await prisma.monitor.findMany({
        where: { type: input.type }
      });
      const existing = existingMonitors.find((monitor) => isSameMonitorQuery(monitor.query, input.query));
      if (existing) {
        const monitor = await prisma.monitor.update({
          where: { id: existing.id },
          data: {
            sources: JSON.stringify(input.sources),
            intervalMinutes: input.intervalMinutes,
            enabled: input.enabled
          }
        });
        res.json(toMonitorDto(monitor));
        return;
      }

      const monitor = await prisma.monitor.create({
        data: {
          ...input,
          sources: JSON.stringify(input.sources)
        }
      });
      res.status(201).json(toMonitorDto(monitor));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/monitors/:id", async (req, res, next) => {
    try {
      const input = monitorPatchSchema.parse(req.body);
      const monitor = await prisma.monitor.update({
        where: { id: req.params.id },
        data: {
          ...input,
          sources: input.sources ? JSON.stringify(input.sources) : undefined
        }
      });
      res.json(toMonitorDto(monitor));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/monitors/:id", async (req, res, next) => {
    try {
      await prisma.monitor.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.get("/events", async (req, res, next) => {
    try {
      const source = z.string().optional().parse(req.query.source);
      const events = await prisma.hotspotEvent.findMany({
        where: source ? { source } : undefined,
        orderBy: { createdAt: "desc" },
        take: 100
      });
      res.json(events.map(toEventDto));
    } catch (error) {
      next(error);
    }
  });

  router.post("/jobs/run-once", async (_req, res, next) => {
    try {
      const result = await scanner.runOnce();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/sources/health", async (_req, res, next) => {
    try {
      const health = await prisma.sourceHealth.findMany({ orderBy: { source: "asc" } });
      res.json(health);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function toMonitorDto(monitor: { sources: string; [key: string]: unknown }) {
  return {
    ...monitor,
    sources: JSON.parse(monitor.sources)
  };
}

function toEventDto(event: { evidenceUrls: string; [key: string]: unknown }) {
  return {
    ...event,
    evidenceUrls: JSON.parse(event.evidenceUrls)
  };
}
