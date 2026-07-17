export type ProjectStatus = "daily-driver" | "track" | "show" | "project" | "for-sale";

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "daily-driver", label: "Daily Driver" },
  { value: "track", label: "Track" },
  { value: "show", label: "Show" },
  { value: "project", label: "Project" },
  { value: "for-sale", label: "For Sale" },
];

const PROJECT_STATUS_SET = new Set<string>(PROJECT_STATUSES.map((s) => s.value));

export function normalizeProjectStatus(value?: string | null): ProjectStatus | null {
  if (!value) return null;
  const trimmed = value.trim();
  return PROJECT_STATUS_SET.has(trimmed) ? (trimmed as ProjectStatus) : null;
}

export function projectStatusLabel(status?: string | null): string | undefined {
  return PROJECT_STATUSES.find((s) => s.value === status)?.label;
}

export function sumInstalledModCosts(
  mods: { status?: string; estimatedCost?: number | null }[],
): number {
  return mods
    .filter((m) => m.status === "installed" || !m.status)
    .reduce((sum, m) => sum + (m.estimatedCost ?? 0), 0);
}

export function formatDynoHighlight(
  buildLogs?: { dynoHp?: number | null; lapTime?: string | null; trackName?: string | null }[],
): string | undefined {
  if (!buildLogs?.length) return undefined;
  const log = buildLogs.find((l) => l.dynoHp || (l.lapTime && l.trackName));
  if (!log) return undefined;
  const parts: string[] = [];
  if (log.dynoHp) parts.push(`${Math.round(log.dynoHp)}hp`);
  if (log.lapTime && log.trackName) parts.push(`${log.lapTime} @ ${log.trackName}`);
  else if (log.trackName) parts.push(log.trackName);
  return parts.join(" · ");
}
