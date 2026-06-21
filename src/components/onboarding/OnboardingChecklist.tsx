"use client";

import { Check, ChevronRight, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Status = {
  hasAvatar: boolean;
  hasVehicle: boolean;
  followCount: number;
  completed: boolean;
  dismissed: boolean;
};

export function OnboardingChecklist() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status || status.completed || status.dismissed) return null;

  const steps = [
    {
      done: status.hasAvatar,
      label: "Add a profile photo",
      href: "/settings",
    },
    {
      done: status.hasVehicle,
      label: "Add your first car",
      href: "/garage",
    },
    {
      done: status.followCount >= 3,
      label: `Follow 3 builders (${Math.min(status.followCount, 3)}/3)`,
      href: "/explore",
    },
  ];

  const progress = steps.filter((s) => s.done).length;

  async function dismiss() {
    await fetch("/api/onboarding", { method: "PATCH" });
    setStatus((s) => (s ? { ...s, dismissed: true } : s));
  }

  return (
    <div className="section-card relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Get started on GearNet</h2>
            <p className="text-xs text-zinc-500">{progress} of 3 complete</p>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="text-zinc-500 hover:text-zinc-300" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
          style={{ width: `${(progress / 3) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 transition-colors hover:border-zinc-700"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  step.done ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className={`flex-1 text-sm ${step.done ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                {step.label}
              </span>
              {!step.done ? <ChevronRight className="h-4 w-4 text-zinc-600" /> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
