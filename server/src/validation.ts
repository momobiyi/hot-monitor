import { z } from "zod";
import { SOURCES } from "./core/types";

export const monitorInputSchema = z.object({
  type: z.enum(["keyword", "topic"]).default("keyword"),
  query: z.string().trim().min(1),
  sources: z.array(z.enum(SOURCES)).min(1).default([...SOURCES]),
  intervalMinutes: z.coerce.number().int().min(5).max(60).default(15),
  enabled: z.boolean().default(true)
});

export const monitorPatchSchema = monitorInputSchema.partial();
