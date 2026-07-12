"use client";

import { streakEncouragement } from "@/lib/maintenance-streak";
import type { BenchSummary } from "@/lib/types";
import { DollarSign, Flame } from "lucide-react";

type Props = { summary: BenchSummary | null };

export function BenchHeaderCards({ summary }: Props) {
  if (!summary) return null;

  const streak = summary.maintenanceStreak;
  const hasStreak = streak > 0;
  const hasSavings = summary.diySavings > 0;

  if (!hasStreak && !hasSavings) return null;

  return (
    <div className="mb-6 space-y-2.5">
      {hasStreak ? (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-zinc-900/50 p-4">
          <p className="flex items-center gap-2 text-base font-semibold text-white">
            <Flame className="h-5 w-5 text-amber-400" />
            {streak} month streak
          </p>
          <p className="mt-1 text-sm text-zinc-400">{streakEncouragement(streak)}</p>
        </div>
      ) : null}
      {hasSavings ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            You saved ${summary.diySavings.toLocaleString()} doing it yourself
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Based on {summary.diyCount} DIY job{summary.diyCount !== 1 ? "s" : ""} vs shop averages in the same categories
          </p>
        </div>
      ) : null}
    </div>
  );
}
