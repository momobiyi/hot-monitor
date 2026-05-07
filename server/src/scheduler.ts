import cron from "node-cron";
import { config } from "./config";
import type { ScannerService } from "./services/scanner";

export function startScheduler(scanner: ScannerService) {
  const minutes = Math.max(5, Math.min(60, config.scanIntervalMinutes));
  return cron.schedule(`*/${minutes} * * * *`, () => {
    void scanner.runOnce();
  });
}
