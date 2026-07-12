import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { VEHICLE_PLATFORMS } from "./platforms";

export type ResolvedManualLink = {
  url: string;
  title: string;
  sourceLabel: string;
  manualType: "archive" | "oem" | "workshop" | "owner";
  verified: boolean;
};

type CacheFile = {
  generatedAt?: string;
  resolvedCount?: number;
  unresolvedCount?: number;
  links: Record<string, ResolvedManualLink | null>;
};

const EMPTY_CACHE: CacheFile = { links: {}, resolvedCount: 0, unresolvedCount: 0 };
const CACHE_PATH = join(process.cwd(), "src/data/manual-link-cache.json");

let cacheSnapshot: CacheFile | null = null;
let cacheMtimeMs = 0;

function readCacheFile(): CacheFile {
  try {
    const stat = statSync(CACHE_PATH);
    if (!cacheSnapshot || stat.mtimeMs !== cacheMtimeMs) {
      cacheSnapshot = JSON.parse(readFileSync(CACHE_PATH, "utf8")) as CacheFile;
      cacheMtimeMs = stat.mtimeMs;
    }
    return cacheSnapshot;
  } catch {
    return cacheSnapshot ?? EMPTY_CACHE;
  }
}

export type VerifiedManualRow = {
  make: string;
  model: string;
  year: number;
  link: ResolvedManualLink;
};

/** Verified cache rows only — avoids scanning the full 78k vehicle index. */
export function getVerifiedManualEntries(): VerifiedManualRow[] {
  const cache = readCacheFile();
  const rows: VerifiedManualRow[] = [];
  for (const [key, link] of Object.entries(cache.links)) {
    if (!link?.verified || !link.url) continue;
    const [make, model, yearStr] = key.split("|");
    if (!make || !model || !yearStr) continue;
    const year = Number.parseInt(yearStr, 10);
    if (!Number.isFinite(year)) continue;
    rows.push({ make, model, year, link });
  }
  return rows;
}

export function manualLinkKey(make: string, model: string, year: number) {
  return `${make}|${model}|${year}`;
}

export function getCachedManualLink(make: string, model: string, year: number): ResolvedManualLink | null {
  const hit = readCacheFile().links[manualLinkKey(make, model, year)];
  if (!hit?.url || !hit.verified) return null;
  return hit;
}

export function getManualLinkCacheMeta() {
  const cache = readCacheFile();
  return {
    generatedAt: cache.generatedAt ?? null,
    resolvedCount: cache.resolvedCount ?? 0,
    unresolvedCount: cache.unresolvedCount ?? 0,
    totalCached: Object.keys(cache.links).length,
  };
}

const BAD_TITLE =
  /lawn mower|flight simulator|radio shack|coco manual|parts catalog|sales brochure|advertisement|motorcycle|atv|snowmobile|trailer|gamer|video game|paranormal/i;
const SERVICE_TITLE =
  /service manual|shop manual|repair manual|workshop manual|factory manual|factory repair|chilton|haynes|helms|workshop|shop guide|technical information guide/i;
const OWNER_TITLE = /owner.?s manual|owner manual|user manual|operator.?s manual/i;

export type ArchiveDoc = { identifier: string; title: string };

export const MIN_STRICT_SCORE = 75;
export const MIN_RELAXED_SCORE = 52;
const MAX_RELAXED_YEAR_DELTA = 6;

function parseTwoDigitYear(twoDigit: number, anchorYear: number) {
  const century = Math.floor(anchorYear / 100) * 100;
  let candidate = century + twoDigit;
  if (candidate < anchorYear - 5) candidate += 100;
  return candidate;
}

export function titleYearRangeCovers(title: string, year: number) {
  const rangeMatch = title.match(/(19|20)(\d{2})\s*[-–]\s*(?:(19|20)(\d{2})|(\d{2}))/i);
  if (!rangeMatch) return false;

  const startYear = parseInt(`${rangeMatch[1]}${rangeMatch[2]}`, 10);
  const endYear =
    rangeMatch[3] && rangeMatch[4]
      ? parseInt(`${rangeMatch[3]}${rangeMatch[4]}`, 10)
      : parseTwoDigitYear(parseInt(rangeMatch[5]!, 10), startYear);

  return year >= startYear && year <= endYear;
}

function extractExplicitYears(title: string) {
  const years: number[] = [];
  const re = /\b(19|20)\d{2}\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(title)) !== null) {
    years.push(parseInt(match[0], 10));
  }
  return years;
}

function modelTokens(model: string) {
  return model
    .split(/[\s/(),+-]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((token) => {
      if (!token || token === "series") return false;
      if (/^[a-z]?\d+[a-z]?$/i.test(token)) return token.length >= 2;
      if (/^\d+$/.test(token)) return token.length >= 2;
      return token.length > 2;
    });
}

function modelMatchesTitle(title: string, model: string) {
  const t = title.toLowerCase();
  const modelLower = model.toLowerCase();
  const tokens = modelTokens(model);
  if (tokens.some((token) => t.includes(token))) return true;
  if (tokens.length === 0 && modelLower.length > 4 && t.includes(modelLower)) return true;
  return false;
}

function findPlatformSpan(make: string, model: string, year: number) {
  for (const platform of VEHICLE_PLATFORMS) {
    if (platform.make !== make || platform.model !== model) continue;
    for (const span of platform.spans) {
      if (year >= span.start && year <= span.end) return span;
    }
  }
  return null;
}

function classifyManualType(title: string): ResolvedManualLink["manualType"] {
  if (/chilton|haynes/i.test(title)) return "workshop";
  if (OWNER_TITLE.test(title)) return "owner";
  return "archive";
}

export function scoreArchiveTitle(
  title: string,
  make: string,
  model: string,
  year: number,
  mode: "strict" | "relaxed" = "strict",
) {
  const t = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const tokens = modelTokens(model);
  const explicitYears = extractExplicitYears(title);
  const inRange = titleYearRangeCovers(title, year);
  const mentionsTargetYear = t.includes(String(year));
  const isService = SERVICE_TITLE.test(title);
  const isOwner = OWNER_TITLE.test(title);

  if (BAD_TITLE.test(title)) return -999;
  if (!isService && !(mode === "relaxed" && isOwner)) return -999;
  if (!t.includes(makeLower)) return -999;
  if (!modelMatchesTitle(title, model)) return -999;

  if (/import car manual|european service manual|passenger car manual/i.test(title) && !mentionsTargetYear && !inRange) {
    return -999;
  }

  if (isOwner && mode === "strict") return -999;
  if (isOwner && !mentionsTargetYear && !inRange) return -999;

  let score = isOwner ? 35 : 40;

  if (mentionsTargetYear) score += 70;
  if (inRange) score += 55;

  if (!mentionsTargetYear && !inRange && explicitYears.length > 0) {
    const closest = explicitYears.reduce(
      (best, y) => (Math.abs(y - year) < Math.abs(best - year) ? y : best),
      explicitYears[0]!,
    );
    const delta = Math.abs(closest - year);
    if (delta === 0) score += 20;
    else if (delta <= 1) score += 8;
    else if (delta <= 3) score -= mode === "relaxed" ? 10 : 25;
    else if (delta <= MAX_RELAXED_YEAR_DELTA && mode === "relaxed") score -= 35;
    else score -= 90;
  }

  for (const token of tokens) {
    if (t.includes(token)) score += 12;
  }

  if (/factory service|oem service|service manual|shop manual|workshop manual/i.test(title)) score += 10;

  return score;
}

const searchCache = new Map<string, ArchiveDoc[]>();

function searchCacheKey(query: string, rows: number, mediatype: "texts" | "books" | "all") {
  return `${mediatype}:${rows}:${query}`;
}

export async function searchArchive(
  query: string,
  rows = 16,
  mediatype: "texts" | "books" | "all" = "texts",
): Promise<ArchiveDoc[]> {
  const cacheKey = searchCacheKey(query, rows, mediatype);
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const q = mediatype === "all" ? query : `${query} AND mediatype:${mediatype}`;
  const params = new URLSearchParams({ q, output: "json", rows: String(rows) });
  params.append("fl[]", "identifier");
  params.append("fl[]", "title");
  params.append("sort[]", "downloads desc");

  const res = await fetch(`https://archive.org/advancedsearch.php?${params}`, {
    headers: { "User-Agent": "GearNet/1.0 (manual-link-resolver; contact: local-dev)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { response?: { docs?: ArchiveDoc[] } };
  const docs = data.response?.docs ?? [];
  searchCache.set(cacheKey, docs);
  return docs;
}

export function clearSearchCache() {
  searchCache.clear();
}

export function pickBestArchiveDoc(
  docs: ArchiveDoc[],
  make: string,
  model: string,
  year: number,
  minScore: number,
  mode: "strict" | "relaxed" = "strict",
) {
  let best: { doc: ArchiveDoc; score: number } | null = null;
  for (const doc of docs) {
    const score = scoreArchiveTitle(doc.title, make, model, year, mode);
    if (score < minScore) continue;
    if (!best || score > best.score) best = { doc, score };
  }
  return best;
}

function toArchiveLink(doc: ArchiveDoc): ResolvedManualLink {
  return {
    url: `https://archive.org/details/${doc.identifier}`,
    title: doc.title,
    sourceLabel: "Internet Archive",
    manualType: classifyManualType(doc.title),
    verified: true,
  };
}

function buildArchiveQueries(make: string, model: string, year: number) {
  const span = findPlatformSpan(make, model, year);
  const queries = [
    `${make} ${model} ${year} service manual`,
    `${make} ${model} ${year} shop manual`,
    `${make} ${model} ${year} repair manual`,
    `${make} ${model} ${year} workshop manual`,
    `${make} ${model} ${year} factory service manual`,
    `${make} ${model} ${year} haynes`,
    `${make} ${model} service manual`,
    `${make} ${model} shop manual`,
    `${make} ${model} chilton repair manual`,
    `${make} ${model} ${year} owner manual`,
  ];

  if (span) {
    queries.push(
      `${make} ${model} ${span.start} ${span.end} shop manual`,
      `${make} ${model} ${span.start}-${span.end} service manual`,
      `${make} ${model} ${span.start} shop manual`,
    );
  }

  return [...new Set(queries)];
}

export function propagateManualLinks(
  links: Record<string, ResolvedManualLink | null>,
  vehicles: Array<[make: string, model: string, year: number]>,
): number {
  const resolvedByMakeModel = new Map<string, ResolvedManualLink[]>();

  for (const [make, model, year] of vehicles) {
    const link = links[manualLinkKey(make, model, year)];
    if (!link?.verified) continue;
    const groupKey = `${make}|${model}`;
    const bucket = resolvedByMakeModel.get(groupKey) ?? [];
    bucket.push(link);
    resolvedByMakeModel.set(groupKey, bucket);
  }

  let added = 0;
  for (const [make, model, year] of vehicles) {
    const key = manualLinkKey(make, model, year);
    if (links[key]?.verified) continue;

    const siblings = resolvedByMakeModel.get(`${make}|${model}`) ?? [];
    for (const link of siblings) {
      if (manualCoversYear(link.title, year)) {
        links[key] = { ...link, verified: true };
        added += 1;
        break;
      }
    }
  }

  return added;
}

export function manualCoversYear(title: string, year: number) {
  const t = title.toLowerCase();
  if (t.includes(String(year))) return true;
  if (titleYearRangeCovers(title, year)) return true;

  const explicitYears = extractExplicitYears(title);
  if (explicitYears.length === 0) return false;

  const closest = explicitYears.reduce(
    (best, y) => (Math.abs(y - year) < Math.abs(best - year) ? y : best),
    explicitYears[0]!,
  );
  return Math.abs(closest - year) <= MAX_RELAXED_YEAR_DELTA;
}

/** Index verified links by make|model for O(siblings) propagation lookups. */
export function buildResolvedLinkIndex(
  links: Record<string, ResolvedManualLink | null>,
): Map<string, ResolvedManualLink[]> {
  const index = new Map<string, ResolvedManualLink[]>();
  for (const [key, link] of Object.entries(links)) {
    if (!link?.verified) continue;
    const [make, model] = key.split("|");
    if (!make || !model) continue;
    const groupKey = `${make}|${model}`;
    const bucket = index.get(groupKey) ?? [];
    bucket.push(link);
    index.set(groupKey, bucket);
  }
  return index;
}

export function addToResolvedLinkIndex(
  index: Map<string, ResolvedManualLink[]>,
  make: string,
  model: string,
  link: ResolvedManualLink,
) {
  if (!link.verified) return;
  const groupKey = `${make}|${model}`;
  const bucket = index.get(groupKey) ?? [];
  bucket.push(link);
  index.set(groupKey, bucket);
}

export function findPropagatableLinkFromIndex(
  index: Map<string, ResolvedManualLink[]>,
  make: string,
  model: string,
  year: number,
): ResolvedManualLink | null {
  for (const link of index.get(`${make}|${model}`) ?? []) {
    if (manualCoversYear(link.title, year)) return link;
  }
  return null;
}

/** Reuse a verified sibling manual when its title covers this model year. */
export function findPropagatableLink(
  links: Record<string, ResolvedManualLink | null>,
  make: string,
  model: string,
  year: number,
): ResolvedManualLink | null {
  return findPropagatableLinkFromIndex(buildResolvedLinkIndex(links), make, model, year);
}

async function resolveFromArchive(make: string, model: string, year: number): Promise<ResolvedManualLink | null> {
  const queries = buildArchiveQueries(make, model, year);

  for (const query of queries) {
    const docs = await searchArchive(query, 20, "texts");
    const strict = pickBestArchiveDoc(docs, make, model, year, MIN_STRICT_SCORE, "strict");
    if (strict) return toArchiveLink(strict.doc);
    const relaxed = pickBestArchiveDoc(docs, make, model, year, MIN_RELAXED_SCORE, "relaxed");
    if (relaxed) return toArchiveLink(relaxed.doc);
  }

  for (const query of queries.slice(0, 6)) {
    for (const mediatype of ["books", "all"] as const) {
      const docs = await searchArchive(query, 12, mediatype);
      const relaxed = pickBestArchiveDoc(docs, make, model, year, MIN_RELAXED_SCORE, "relaxed");
      if (relaxed) return toArchiveLink(relaxed.doc);
    }
  }

  return null;
}

/** Live lookup across all manual sources (ignores cache). */
export async function resolveManualLinkLive(
  make: string,
  model: string,
  year: number,
): Promise<ResolvedManualLink | null> {
  return resolveFromArchive(make, model, year);
}

/** Resolve a direct service-manual URL for make/model/year. */
export async function resolveManualLink(
  make: string,
  model: string,
  year: number,
): Promise<ResolvedManualLink | null> {
  const cached = getCachedManualLink(make, model, year);
  if (cached) return cached;
  return resolveManualLinkLive(make, model, year);
}
