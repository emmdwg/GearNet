import type { ServiceManual } from "@/lib/types";
import { getCachedManualLink, getVerifiedManualEntries } from "./resolve-link";
import type { ResolvedManualLink } from "./resolve-link";
import type { VehicleTuple } from "./types";

export type ManualCatalogEntry = ServiceManual;

export function hasVerifiedManualUrl(entry: { sourceUrl?: string | null }): boolean {
  return typeof entry.sourceUrl === "string" && entry.sourceUrl.trim().length > 0;
}

export function withResolvedManuals<T extends { sourceUrl?: string | null }>(entries: T[]): T[] {
  return entries.filter(hasVerifiedManualUrl);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function urlKey(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48);
}

function formatYearRange(start: number, end: number) {
  return start === end ? String(start) : `${start}-${end}`;
}

function parseTwoDigitYear(twoDigit: number, anchorYear: number) {
  const century = Math.floor(anchorYear / 100) * 100;
  let candidate = century + twoDigit;
  if (candidate < anchorYear - 5) candidate += 100;
  return candidate;
}

function parseTitleYearBounds(title: string): { start: number; end: number } | null {
  const rangeMatch = title.match(/(19|20)(\d{2})\s*[-–]\s*(?:(19|20)(\d{2})|(\d{2}))/i);
  if (rangeMatch) {
    const start = parseInt(`${rangeMatch[1]}${rangeMatch[2]}`, 10);
    const end =
      rangeMatch[3] && rangeMatch[4]
        ? parseInt(`${rangeMatch[3]}${rangeMatch[4]}`, 10)
        : parseTwoDigitYear(parseInt(rangeMatch[5]!, 10), start);
    return { start, end };
  }

  const single = title.match(/\b((19|20)\d{2})\b/);
  if (single) {
    const year = parseInt(single[1]!, 10);
    return { start: year, end: year };
  }

  return null;
}

function clipRangeToTitle(
  range: { start: number; end: number },
  title: string,
  yearsInCluster: number[],
) {
  const bounds = parseTitleYearBounds(title);
  if (!bounds) return range;

  const clusterMin = Math.min(...yearsInCluster);
  const clusterMax = Math.max(...yearsInCluster);
  const start = Math.max(range.start, bounds.start, clusterMin);
  const end = Math.min(range.end, bounds.end, clusterMax);
  if (start > end) return range;
  return { start, end };
}

type UrlGroup = {
  make: string;
  model: string;
  url: string;
  title: string;
  sourceLabel: string;
  manualType: ServiceManual["manualType"];
  years: number[];
};

function addUrlGroup(
  byUrl: Map<string, UrlGroup>,
  make: string,
  model: string,
  year: number,
  link: ResolvedManualLink,
) {
  const key = `${make}|${model}|${link.url}`;
  const existing = byUrl.get(key);
  if (existing) {
    existing.years.push(year);
  } else {
    byUrl.set(key, {
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

/** Build generation-grouped catalog entries from verified manual-link cache rows. */
export function buildGenerationCatalog(vehicles?: VehicleTuple[]): ManualCatalogEntry[] {
  const byUrl = new Map<string, UrlGroup>();

  if (vehicles && vehicles.length > 0) {
    for (const [make, model, year] of vehicles) {
      const link = getCachedManualLink(make, model, year);
      if (!link) continue;
      addUrlGroup(byUrl, make, model, year, link);
    }
  } else {
    for (const { make, model, year, link } of getVerifiedManualEntries()) {
      addUrlGroup(byUrl, make, model, year, link);
    }
  }

  const entries: ManualCatalogEntry[] = [];

  for (const group of byUrl.values()) {
    const sortedYears = [...new Set(group.years)].sort((a, b) => a - b);
    const yearStart = sortedYears[0]!;
    const yearEnd = sortedYears[sortedYears.length - 1]!;
    const clipped = clipRangeToTitle({ start: yearStart, end: yearEnd }, group.title, sortedYears);
    const yearRange = formatYearRange(clipped.start, clipped.end);
    const displayTitle = `${yearRange} ${group.make} ${group.model} Service Manual`;

    entries.push({
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

  return withResolvedManuals(entries).sort(
    (a, b) =>
      a.vehicleMake.localeCompare(b.vehicleMake) ||
      a.vehicleModel.localeCompare(b.vehicleModel) ||
      (a.yearStart ?? 0) - (b.yearStart ?? 0),
  );
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeModelToken(token: string) {
  return token.toLowerCase().replace(/[^\w]/g, "");
}

export function parseVehicleSearchQuery(query: string) {
  const raw = query.trim();
  const yearMatch = raw.match(/\b((?:19|20)\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]!, 10) : undefined;
  const withoutYear = raw.replace(/\b(?:19|20)\d{2}\b/g, " ").replace(/\s+/g, " ").trim();
  const textTokens = tokenize(withoutYear);

  let make: string | undefined;
  let modelTokens: string[] = [];

  if (textTokens.length >= 2) {
    make = textTokens[0];
    modelTokens = textTokens.slice(1);
  } else if (textTokens.length === 1) {
    make = textTokens[0];
  }

  return { year, make, modelTokens, textTokens };
}

export function modelMatchesQuery(entryModel: string, modelTokens: string[]): boolean {
  if (!modelTokens.length) return true;
  const modelNorm = normalizeModelToken(entryModel);
  return modelTokens.every((token) => {
    const tokenNorm = normalizeModelToken(token);
    if (!tokenNorm) return true;
    return modelNorm.includes(tokenNorm);
  });
}

function makeMatchesQuery(entryMake: string, make?: string): boolean {
  if (!make) return true;
  const makeLower = make.toLowerCase();
  const entryLower = entryMake.toLowerCase();
  return entryLower === makeLower || entryLower.startsWith(makeLower) || entryLower.includes(makeLower);
}

function scoreGeneration(
  entry: ManualCatalogEntry,
  parsed: ReturnType<typeof parseVehicleSearchQuery>,
  rawQuery: string,
  filterYear?: number,
) {
  const yearStart = entry.yearStart ?? parseInt(entry.yearRange, 10);
  const yearEnd = entry.yearEnd ?? yearStart;
  const effectiveYear = filterYear ?? parsed.year;

  if (effectiveYear !== undefined && (effectiveYear < yearStart || effectiveYear > yearEnd)) {
    return 0;
  }

  if (parsed.modelTokens.length && !modelMatchesQuery(entry.vehicleModel, parsed.modelTokens)) {
    return 0;
  }

  if (parsed.make && !makeMatchesQuery(entry.vehicleMake, parsed.make)) {
    return 0;
  }

  const tokens = parsed.textTokens;
  if (!tokens.length && effectiveYear === undefined) return 1;

  const text = `${entry.yearRange} ${entry.vehicleMake} ${entry.vehicleModel} ${entry.title}`.toLowerCase();
  const q = rawQuery.toLowerCase().trim();
  let score = 0;

  for (const token of tokens) {
    if (text.includes(token)) score += 10;
    if (entry.vehicleMake.toLowerCase().startsWith(token)) score += 30;
    if (entry.vehicleModel.toLowerCase().includes(token)) score += 22;
    const yearNum = parseInt(token, 10);
    if (!Number.isNaN(yearNum) && yearNum >= yearStart && yearNum <= yearEnd) score += 45;
  }

  if (effectiveYear !== undefined && effectiveYear >= yearStart && effectiveYear <= yearEnd) {
    score += 55;
  }

  if (parsed.make && entry.vehicleMake.toLowerCase() === parsed.make.toLowerCase()) {
    score += 40;
  }

  if (parsed.modelTokens.length && modelMatchesQuery(entry.vehicleModel, parsed.modelTokens)) {
    score += 90;
    const modelNorm = normalizeModelToken(entry.vehicleModel);
    const queryModel = parsed.modelTokens.map(normalizeModelToken).join("");
    if (modelNorm === queryModel) score += 80;
    else if (modelNorm.includes(queryModel)) score += 40;
  }

  if (q && text.startsWith(q)) score += 45;
  if (q && `${entry.vehicleMake} ${entry.vehicleModel}`.toLowerCase().startsWith(q.replace(/\b(?:19|20)\d{2}\b/g, "").trim())) {
    score += 35;
  }

  return score;
}

export function searchGenerationCatalog(
  catalog: ManualCatalogEntry[],
  query: string,
  options?: { limit?: number; suggestionLimit?: number; filterYear?: number },
) {
  const limit = options?.limit ?? 48;
  const suggestionLimit = options?.suggestionLimit ?? 8;
  const parsed = parseVehicleSearchQuery(query);
  const filterYear = options?.filterYear ?? parsed.year;

  let pool = withResolvedManuals(catalog);

  if (parsed.make) {
    const makeLower = parsed.make.toLowerCase();
    pool = pool.filter((entry) => entry.vehicleMake.toLowerCase().includes(makeLower));
  }

  if (parsed.modelTokens.length) {
    pool = pool.filter((entry) => modelMatchesQuery(entry.vehicleModel, parsed.modelTokens));
  }

  if (filterYear !== undefined) {
    pool = pool.filter((entry) => {
      const start = entry.yearStart ?? parseInt(entry.yearRange, 10);
      const end = entry.yearEnd ?? start;
      return filterYear >= start && filterYear <= end;
    });
  }

  if (!parsed.textTokens.length && filterYear === undefined) {
    const results = pool.slice(0, limit);
    const suggestions = pool.slice(0, suggestionLimit).map((entry) => ({
      id: entry.id,
      label: `${entry.yearRange} ${entry.vehicleMake} ${entry.vehicleModel}`,
      subtitle: entry.sourceLabel ? `Service manual · ${entry.sourceLabel}` : "Verified service manual",
      query: `${entry.yearRange} ${entry.vehicleMake} ${entry.vehicleModel}`,
    }));
    return { results, suggestions, total: pool.length };
  }

  const scored = pool
    .map((entry) => ({ entry, score: scoreGeneration(entry, parsed, query, filterYear) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (filterYear !== undefined) {
        const ad = Math.abs(filterYear - (a.entry.yearStart ?? filterYear));
        const bd = Math.abs(filterYear - (b.entry.yearStart ?? filterYear));
        if (ad !== bd) return ad - bd;
      }
      return (
        a.entry.vehicleMake.localeCompare(b.entry.vehicleMake) ||
        a.entry.vehicleModel.localeCompare(b.entry.vehicleModel) ||
        (a.entry.yearStart ?? 0) - (b.entry.yearStart ?? 0)
      );
    });

  const results = scored.slice(0, limit).map(({ entry }) => entry);
  const suggestions = scored.slice(0, suggestionLimit).map(({ entry }) => ({
    id: entry.id,
    label: `${entry.yearRange} ${entry.vehicleMake} ${entry.vehicleModel}`,
    subtitle: entry.sourceLabel ? `Service manual · ${entry.sourceLabel}` : "Verified service manual",
    query: filterYear
      ? `${filterYear} ${entry.vehicleMake} ${entry.vehicleModel}`
      : `${entry.yearRange} ${entry.vehicleMake} ${entry.vehicleModel}`,
  }));

  return { results, suggestions, total: scored.length };
}

export function generationCoversYear(entry: ManualCatalogEntry, year: number) {
  const start = entry.yearStart ?? parseInt(entry.yearRange, 10);
  const end = entry.yearEnd ?? start;
  return year >= start && year <= end;
}

export function vehicleHasResolvedManual(make: string, model: string, year: number) {
  return getCachedManualLink(make, model, year) !== null;
}
