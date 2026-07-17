/** Infer city from User.location (e.g. "Austin, TX" → "Austin"). */
export function inferCityFromLocation(location: string | null | undefined): string | null {
  if (!location?.trim()) return null;
  const city = location.split(",")[0]?.trim();
  return city || null;
}

export function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}
