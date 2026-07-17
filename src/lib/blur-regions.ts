/** Normalized rectangle (0–1) relative to exported image dimensions. */
export type BlurRegion = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type VideoChapter = {
  timeSec: number;
  label: string;
};

export function parseBlurRegions(raw: unknown): BlurRegion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const x = Number(o.x);
      const y = Number(o.y);
      const w = Number(o.w);
      const h = Number(o.h);
      if (![x, y, w, h].every((n) => Number.isFinite(n))) return null;
      if (w <= 0 || h <= 0) return null;
      return {
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
        w: Math.min(1 - x, Math.max(0.01, w)),
        h: Math.min(1 - y, Math.max(0.01, h)),
      };
    })
    .filter((r): r is BlurRegion => r !== null);
}

export function parseVideoChapters(raw: unknown): VideoChapter[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const timeSec = Number(o.timeSec);
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!Number.isFinite(timeSec) || timeSec < 0 || !label) return null;
      return { timeSec, label: label.slice(0, 80) };
    })
    .filter((c): c is VideoChapter => c !== null)
    .sort((a, b) => a.timeSec - b.timeSec)
    .slice(0, 10);
}
