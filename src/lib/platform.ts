export function isProActive(user: {
  isPro?: boolean;
  proExpiresAt?: Date | string | null;
}): boolean {
  if (!user.isPro) return false;
  if (!user.proExpiresAt) return true;
  return new Date(user.proExpiresAt) > new Date();
}

export function isBoosted(boostedUntil?: Date | string | null): boolean {
  if (!boostedUntil) return false;
  return new Date(boostedUntil) > new Date();
}

export function boostSortKey(boostedUntil?: Date | string | null): number {
  return isBoosted(boostedUntil) ? 1 : 0;
}
