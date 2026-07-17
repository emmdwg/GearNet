export const REFERRAL_TIERS = [
  { min: 10, id: "gold", label: "Gold Referrer", emoji: "🥇" },
  { min: 5, id: "silver", label: "Silver Referrer", emoji: "🥈" },
  { min: 1, id: "bronze", label: "Bronze Referrer", emoji: "🥉" },
] as const;

export function getReferralTier(count: number) {
  return REFERRAL_TIERS.find((t) => count >= t.min) ?? null;
}

export function getNextReferralTier(count: number) {
  const tiers = [...REFERRAL_TIERS].reverse();
  return tiers.find((t) => count < t.min) ?? null;
}

export function referralTierProgress(count: number) {
  const current = getReferralTier(count);
  const next = getNextReferralTier(count);
  if (!next) return { current, next: null, progress: 1, remaining: 0 };
  const floor = current?.min ?? 0;
  const span = next.min - floor;
  const progress = span > 0 ? Math.min(1, (count - floor) / span) : 0;
  return { current, next, progress, remaining: Math.max(0, next.min - count) };
}
