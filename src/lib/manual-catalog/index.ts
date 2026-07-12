import verifiedCatalog from "@/data/verified-manual-catalog.json";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MANUALS_PER_VEHICLE } from "./build-manuals";
import {
  buildGenerationCatalog,
  parseVehicleSearchQuery,
  searchGenerationCatalog,
  vehicleHasResolvedManual,
  withResolvedManuals,
} from "./group-manuals";
import { getManualLinkCacheMeta } from "./resolve-link";
import type {
  ManualCatalogEntry,
  ManualSearchResult,
  VehicleIndexFile,
} from "./types";

type VerifiedCatalogFile = {
  generatedAt?: string;
  sourceCacheAt?: string | null;
  vehicleCount?: number;
  verifiedLinkCount?: number;
  generationCount?: number;
  manuals?: ManualCatalogEntry[];
};

const VERIFIED = verifiedCatalog as VerifiedCatalogFile;

const INDEX_FALLBACK: VehicleIndexFile = {
  phase: 1,
  generatedAt: VERIFIED.generatedAt ?? new Date().toISOString(),
  startYear: 1980,
  endYear: new Date().getFullYear(),
  vehicleCount: VERIFIED.vehicleCount ?? 0,
  makeCount: 0,
  note: "Verified manual catalog",
  vehicles: [],
};

function loadVehicleIndex(): VehicleIndexFile {
  try {
    const path = join(process.cwd(), "src/data/nhtsa-vehicle-index.json");
    if (!existsSync(path)) return INDEX_FALLBACK;
    return JSON.parse(readFileSync(path, "utf8")) as VehicleIndexFile;
  } catch {
    return INDEX_FALLBACK;
  }
}

const INDEX = loadVehicleIndex();

let cachedGenerations: ManualCatalogEntry[] | null = null;
let cachedGenerationsKey: string | null = null;
let cachedByMake: Map<string, ManualCatalogEntry[]> | null = null;

/**
 * Prefer the committed verified-manual-catalog.json (deployable on web/Vercel).
 * Fall back to building from the full link cache when present locally.
 */
function getGenerationCatalog(): ManualCatalogEntry[] {
  const linkMeta = getManualLinkCacheMeta();
  const cacheKey =
    VERIFIED.sourceCacheAt ??
    VERIFIED.generatedAt ??
    linkMeta.generatedAt ??
    "static";

  if (cachedGenerations && cachedGenerationsKey === cacheKey) {
    return cachedGenerations;
  }

  const prebuilt = Array.isArray(VERIFIED.manuals) ? VERIFIED.manuals : [];
  if (prebuilt.length > 0) {
    cachedGenerations = withResolvedManuals(prebuilt);
  } else {
    cachedGenerations = buildGenerationCatalog();
  }
  cachedGenerationsKey = cacheKey;
  cachedByMake = null;
  return cachedGenerations;
}

function getCatalogForMake(make?: string): ManualCatalogEntry[] {
  const catalog = getGenerationCatalog();
  if (!make?.trim()) return catalog;
  const makeLower = make.trim().toLowerCase();
  if (!cachedByMake) {
    cachedByMake = new Map();
    for (const entry of catalog) {
      const key = entry.vehicleMake.toLowerCase();
      const bucket = cachedByMake.get(key) ?? [];
      bucket.push(entry);
      cachedByMake.set(key, bucket);
    }
  }
  const exact = cachedByMake.get(makeLower);
  if (exact?.length) return exact;
  return catalog.filter((entry) => entry.vehicleMake.toLowerCase().includes(makeLower));
}

export function getVehicleIndexMeta() {
  const linkMeta = getManualLinkCacheMeta();
  const generations = withResolvedManuals(getGenerationCatalog());
  return {
    phase: INDEX.phase,
    generatedAt: INDEX.generatedAt,
    startYear: INDEX.startYear,
    endYear: INDEX.endYear,
    vehicleCount: VERIFIED.vehicleCount ?? INDEX.vehicleCount,
    makeCount: INDEX.makeCount,
    note: INDEX.note,
    manualsResolved: VERIFIED.verifiedLinkCount ?? linkMeta.resolvedCount,
    manualsUnresolved: linkMeta.unresolvedCount,
    manualGenerationCount: VERIFIED.generationCount ?? generations.length,
    manualsCacheUpdated: VERIFIED.generatedAt ?? linkMeta.generatedAt,
  };
}

export function getManualCatalog(limit = 48): ManualCatalogEntry[] {
  const catalog = withResolvedManuals(getGenerationCatalog());
  if (limit <= 0) return catalog;
  return catalog.slice(0, limit);
}

export function searchManualCatalog(
  query: string,
  options?: { limit?: number; suggestionLimit?: number; year?: number; make?: string },
): ManualSearchResult {
  const limit = options?.limit ?? 48;
  const suggestionLimit = options?.suggestionLimit ?? 8;
  const parsed = parseVehicleSearchQuery(query);
  const make = options?.make ?? parsed.make;
  const year = options?.year ?? parsed.year;
  const catalog = getCatalogForMake(make);

  const searchQuery = year && !query ? String(year) : query;
  const { results, suggestions, total } = searchGenerationCatalog(catalog, searchQuery, {
    limit,
    suggestionLimit,
    filterYear: year,
  });

  return {
    suggestions,
    results,
    total,
    vehicleTotal: total,
    phase: INDEX.phase,
  };
}

export function getManualMakes() {
  return [...new Set(withResolvedManuals(getGenerationCatalog()).map((entry) => entry.vehicleMake))].sort();
}

export { buildGenerationCatalog, vehicleHasResolvedManual, withResolvedManuals, MANUALS_PER_VEHICLE };
