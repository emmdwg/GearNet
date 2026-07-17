"use client";

import { getReferralTier, referralTierProgress } from "@/lib/referrals";

export function ReferralProgressBar({ count }: { count: number }) {
  const { next, progress, remaining } = referralTierProgress(count);
  const tier = getReferralTier(count);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">
          {count} referral{count === 1 ? "" : "s"}
          {tier ? (
            <span className="ml-2 text-amber-400">
              {tier.emoji} {tier.label}
            </span>
          ) : null}
        </span>
        {next ? (
          <span className="text-xs text-zinc-500">{remaining} more to {next.label}</span>
        ) : (
          <span className="text-xs text-amber-400">Max referral tier reached</span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
