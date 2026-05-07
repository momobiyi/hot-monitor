import cors from "cors";
import express from "express";
import type { PrismaClient } from "@prisma/client";
import type { ScannerService } from "./services/scanner";
import { createRouter } from "./routes";
import { config } from "./config";

export function createApp(prisma: PrismaClient, scanner: ScannerService) {
  const app = express();
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", createRouter(prisma, scanner));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    res.status(400).json({ error: message });
  });
  return app;
}
