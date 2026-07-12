import type { ServiceManual } from "@/lib/types";

export function hasVerifiedManualUrl(manual: ServiceManual) {
  return typeof manual.sourceUrl === "string" && manual.sourceUrl.trim().length > 0;
}

export function withResolvedManualsClient(manuals: ServiceManual[]) {
  return manuals.filter(hasVerifiedManualUrl);
}

/** Client-safe payload normalizer — mirrors mobile/lib/api.ts */
export function normalizeServiceManualsResponse(data: unknown): {
  results: ServiceManual[];
  total: number;
  vehicleTotal: number;
  vehicleCount: number;
  phase: number;
} {
  if (Array.isArray(data)) {
    const results = withResolvedManualsClient(data);
    return {
      results,
      total: results.length,
      vehicleTotal: results.length,
      vehicleCount: results.length,
      phase: 1,
    };
  }
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const results = withResolvedManualsClient(
      Array.isArray(record.results) ? (record.results as ServiceManual[]) : [],
    );
    const vehicleTotal =
      typeof record.vehicleTotal === "number"
        ? record.vehicleTotal
        : typeof record.count === "number"
          ? record.count
          : results.length;
    const vehicleCount =
      typeof record.vehicleCount === "number" ? record.vehicleCount : vehicleTotal;
    return {
      results,
      total: typeof record.total === "number" ? record.total : results.length,
      vehicleTotal,
      vehicleCount,
      phase: typeof record.phase === "number" ? record.phase : 1,
    };
  }
  return { results: [], total: 0, vehicleTotal: 0, vehicleCount: 0, phase: 1 };
}
