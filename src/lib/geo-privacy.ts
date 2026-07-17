/** Approximate coords for public maps (~1 km) so exact home pins aren't exposed. */
export function publicListingCoords(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return { latitude: undefined as number | undefined, longitude: undefined as number | undefined };
  }
  return {
    latitude: Math.round(lat * 100) / 100,
    longitude: Math.round(lng * 100) / 100,
  };
}
