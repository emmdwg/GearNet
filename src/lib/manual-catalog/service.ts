import type { ServiceManual } from "@/lib/types";
import { getManualCatalog, getVehicleIndexMeta } from "./index";
import { withResolvedManuals } from "./group-manuals";

export type ServiceManualsPayload = {
  results: ServiceManual[];
  total: number;
  vehicleTotal: number;
  vehicleCount: number;
  phase: number;
};

export function normalizeServiceManualsPayload(data: unknown): ServiceManualsPayload {
  if (Array.isArray(data)) {
    const results = withResolvedManuals(data);
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
    const results = withResolvedManuals(
      Array.isArray(record.results) ? (record.results as ServiceManual[]) : [],
    );
    const vehicleTotal =
      typeof record.vehicleTotal === "number"
        ? record.vehicleTotal
        : typeof record.count === "number"
          ? record.count
          : results.length;
    const total = typeof record.total === "number" ? record.total : results.length;
    const vehicleCount =
      typeof record.vehicleCount === "number" ? record.vehicleCount : vehicleTotal;

    return {
      results,
      total,
      vehicleTotal,
      vehicleCount,
      phase: typeof record.phase === "number" ? record.phase : 1,
    };
  }

  return { results: [], total: 0, vehicleTotal: 0, vehicleCount: 0, phase: 1 };
}

export function getServiceManualsPayload(limit = 48, offset = 0): ServiceManualsPayload {
  try {
    const meta = getVehicleIndexMeta();
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const safeOffset = Math.max(offset, 0);
    const catalog = getManualCatalog(0);
    const results = catalog.slice(safeOffset, safeOffset + safeLimit);
    const total = meta.manualGenerationCount || catalog.length;
    return {
      results,
      total,
      vehicleTotal: total,
      vehicleCount: meta.vehicleCount,
      phase: meta.phase,
    };
  } catch (error) {
    console.error("getServiceManualsPayload failed:", error);
    return { results: [], total: 0, vehicleTotal: 0, vehicleCount: 0, phase: 1 };
  }
}
