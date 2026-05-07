export function normalizeMonitorQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isSameMonitorQuery(left: string, right: string): boolean {
  return normalizeMonitorQuery(left) === normalizeMonitorQuery(right);
}
