/**
 * Builds a deployable generation catalog from manual-link-cache.json.
 * Output: src/data/verified-manual-catalog.json (commit this — not the huge cache).
 *
 * Run: npx tsx scripts/export-verified-manual-catalog.ts
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

type ResolvedManualLink = {
  url: string;
  title: string;
  sourceLabel: string;
  manualType: "archive" | "oem" | "workshop" | "owner";
  verified: boolean;
};

type CacheFile = {
  generatedAt?: string;
  resolvedCount?: number;
  links: Record<string, ResolvedManualLink | null>;
};

type CatalogEntry = {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  yearRange: string;
  yearStart: number;
  yearEnd: number;
  title: string;
  sections: string[];
  sourceUrl: string;
  sourceLabel: string;
  manualType: ResolvedManualLink["manualType"];
  searchText: string;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function urlKey(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48);
}

function formatYearRange(start: number, end: number) {
  return start === end ? String(start) : `${start}-${end}`;
}

const root = process.cwd();
const cachePath = join(root, "src/data/manual-link-cache.json");
const indexPath = join(root, "src/data/nhtsa-vehicle-index.json");
const outPath = join(root, "src/data/verified-manual-catalog.json");

const cache = JSON.parse(readFileSync(cachePath, "utf8")) as CacheFile;
let vehicleCount = 0;
try {
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as { vehicleCount?: number };
  vehicleCount = index.vehicleCount ?? 0;
} catch {
  vehicleCount = 0;
}

type UrlGroup = {
  make: string;
  model: string;
  url: string;
  title: string;
  sourceLabel: string;
  manualType: ResolvedManualLink["manualType"];
  years: number[];
};

const byUrl = new Map<string, UrlGroup>();
let verifiedLinkCount = 0;

for (const [key, link] of Object.entries(cache.links)) {
  if (!link?.verified || !link.url) continue;
  verifiedLinkCount += 1;
  const [make, model, yearStr] = key.split("|");
  const year = Number.parseInt(yearStr ?? "", 10);
  if (!make || !model || !Number.isFinite(year)) continue;
  const gkey = `${make}|${model}|${link.url}`;
  const existing = byUrl.get(gkey);
  if (existing) {
    existing.years.push(year);
  } else {
    byUrl.set(gkey, {
      make,
      model,
      url: link.url,
      title: link.title,
      sourceLabel: link.sourceLabel,
      manualType: link.manualType,
      years: [year],
    });
  }
}

const manuals: CatalogEntry[] = [];

for (const group of byUrl.values()) {
  const years = [...new Set(group.years)].sort((a, b) => a - b);
  const yearStart = years[0]!;
  const yearEnd = years[years.length - 1]!;
  const yearRange = formatYearRange(yearStart, yearEnd);
  const displayTitle = `${yearRange} ${group.make} ${group.model} Service Manual`;
  manuals.push({
    id: `manual-${slugify(group.make)}-${slugify(group.model)}-${yearStart}-${yearEnd}-${slugify(urlKey(group.url))}`,
    vehicleMake: group.make,
    vehicleModel: group.model,
    yearRange,
    yearStart,
    yearEnd,
    title: displayTitle,
    sections: ["Full manual"],
    sourceUrl: group.url,
    sourceLabel: group.sourceLabel,
    manualType: group.manualType,
    searchText: [
      group.make,
      group.model,
      yearRange,
      String(yearStart),
      String(yearEnd),
      displayTitle,
      group.title,
      group.sourceLabel,
    ]
      .join(" ")
      .toLowerCase(),
  });
}

manuals.sort(
  (a, b) =>
    a.vehicleMake.localeCompare(b.vehicleMake) ||
    a.vehicleModel.localeCompare(b.vehicleModel) ||
    a.yearStart - b.yearStart,
);

const payload = {
  generatedAt: new Date().toISOString(),
  sourceCacheAt: cache.generatedAt ?? null,
  vehicleCount,
  verifiedLinkCount: cache.resolvedCount ?? verifiedLinkCount,
  generationCount: manuals.length,
  manuals,
};

writeFileSync(outPath, JSON.stringify(payload));
const size = statSync(outPath).size;
console.log(
  JSON.stringify(
    {
      out: outPath,
      generations: manuals.length,
      verifiedLinks: payload.verifiedLinkCount,
      vehicleCount,
      bytes: size,
      mb: Number((size / 1e6).toFixed(2)),
    },
    null,
    2,
  ),
);
