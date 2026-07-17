const STORAGE_KEY = "gearnet-near-you-radius";
const DEFAULT_RADIUS = 50;

export function getStoredNearYouRadius(): number {
  if (typeof window === "undefined") return DEFAULT_RADIUS;
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed < 5 || parsed > 500) return DEFAULT_RADIUS;
  return Math.round(parsed);
}

export function setStoredNearYouRadius(radius: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(Math.round(radius)));
}

export { DEFAULT_RADIUS as NEAR_YOU_DEFAULT_RADIUS };
