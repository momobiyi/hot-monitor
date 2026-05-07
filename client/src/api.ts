import type { HotspotEvent, Monitor, SourceHealth, SourceName } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:4000/api";

export async function getMonitors(): Promise<Monitor[]> {
  return request("/monitors");
}

export async function createMonitor(input: {
  type: "keyword" | "topic";
  query: string;
  sources: SourceName[];
  intervalMinutes: number;
  enabled: boolean;
}): Promise<Monitor> {
  return request("/monitors", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function patchMonitor(id: string, input: Partial<Monitor>): Promise<Monitor> {
  return request(`/monitors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function getEvents(): Promise<HotspotEvent[]> {
  return request("/events");
}

export async function getSourceHealth(): Promise<SourceHealth[]> {
  return request("/sources/health");
}

export async function runOnce(): Promise<{ events: number }> {
  return request("/jobs/run-once", { method: "POST" });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}
