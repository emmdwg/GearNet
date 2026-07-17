export type RouteStop = { name: string; lat: number; lng: number };

export function parseRouteStops(value: string | null | undefined): RouteStop[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): RouteStop | null => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const lat = Number(row.lat ?? row.latitude);
        const lng = Number(row.lng ?? row.longitude);
        const name = String(row.name ?? row.title ?? "Stop").trim();
        if (!name || Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { name, lat, lng };
      })
      .filter((s): s is RouteStop => s !== null);
  } catch {
    return [];
  }
}
