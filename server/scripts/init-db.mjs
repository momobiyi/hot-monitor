import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = resolve("server/prisma/dev.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Monitor" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "sources" TEXT NOT NULL,
  "intervalMinutes" INTEGER NOT NULL DEFAULT 15,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "SourceItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "monitorId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "snippet" TEXT NOT NULL,
  "author" TEXT,
  "publishedAt" DATETIME,
  "fingerprint" TEXT NOT NULL,
  "raw" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourceItem_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AiJudgement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceItemId" TEXT NOT NULL,
  "isRelevant" BOOLEAN NOT NULL,
  "isAuthentic" BOOLEAN NOT NULL,
  "isNew" BOOLEAN NOT NULL,
  "confidence" REAL NOT NULL,
  "reason" TEXT NOT NULL,
  "evidenceUrls" TEXT NOT NULL,
  "shouldNotify" BOOLEAN NOT NULL,
  "raw" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiJudgement_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "SourceItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "HotspotEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "monitorId" TEXT NOT NULL,
  "aiJudgementId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "snippet" TEXT NOT NULL,
  "confidence" REAL NOT NULL,
  "reason" TEXT NOT NULL,
  "evidenceUrls" TEXT NOT NULL,
  "notifiedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HotspotEvent_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HotspotEvent_aiJudgementId_fkey" FOREIGN KEY ("aiJudgementId") REFERENCES "AiJudgement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SourceHealth" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "lastCheckedAt" DATETIME NOT NULL,
  "lastSuccessAt" DATETIME,
  "errorMessage" TEXT,
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "SourceItem_monitorId_fingerprint_key" ON "SourceItem"("monitorId", "fingerprint");
CREATE INDEX IF NOT EXISTS "SourceItem_source_idx" ON "SourceItem"("source");
CREATE INDEX IF NOT EXISTS "SourceItem_createdAt_idx" ON "SourceItem"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AiJudgement_sourceItemId_key" ON "AiJudgement"("sourceItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "HotspotEvent_aiJudgementId_key" ON "HotspotEvent"("aiJudgementId");
CREATE INDEX IF NOT EXISTS "HotspotEvent_createdAt_idx" ON "HotspotEvent"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "SourceHealth_source_key" ON "SourceHealth"("source");
`);

db.close();
console.log(`Initialized SQLite database at ${dbPath}`);
