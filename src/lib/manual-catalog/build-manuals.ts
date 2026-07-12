import { buildGenerationCatalog, withResolvedManuals } from "./group-manuals";
import type { ManualCatalogEntry, VehicleTuple } from "./types";

export { buildGenerationCatalog, searchGenerationCatalog, vehicleHasResolvedManual, withResolvedManuals } from "./group-manuals";

/** @deprecated Use buildGenerationCatalog — kept for imports that expect per-vehicle expansion. */
export function buildVehicleManuals(make: string, model: string, year: number): ManualCatalogEntry[] {
  return buildGenerationCatalog([[make, model, year]]).filter(
    (entry) =>
      entry.vehicleMake === make &&
      entry.vehicleModel === model &&
      (entry.yearStart ?? year) <= year &&
      (entry.yearEnd ?? year) >= year,
  );
}

export const MANUALS_PER_VEHICLE = 1;

export function expandVehiclesToManuals(
  vehicles: VehicleTuple[],
  manualLimit: number,
  catalog?: ManualCatalogEntry[],
): ManualCatalogEntry[] {
  const generations = catalog ?? buildGenerationCatalog();
  const matched = new Map<string, ManualCatalogEntry>();

  for (const [make, model, year] of vehicles) {
    for (const entry of generations) {
      if (entry.vehicleMake !== make || entry.vehicleModel !== model) continue;
      const start = entry.yearStart ?? parseInt(entry.yearRange, 10);
      const end = entry.yearEnd ?? start;
      if (year >= start && year <= end) {
        matched.set(entry.id, entry);
        break;
      }
    }
  }

  return withResolvedManuals([...matched.values()]).slice(0, manualLimit);
}
