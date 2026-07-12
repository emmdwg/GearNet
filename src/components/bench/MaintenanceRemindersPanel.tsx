"use client";

import type { MaintenanceLog, ServiceSuggestion } from "@/lib/types";
import { AlertTriangle, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  logs: MaintenanceLog[];
  vehicleId?: string;
  onApplySuggestion?: (suggestion: ServiceSuggestion) => void;
};

export function MaintenanceRemindersPanel({ logs, vehicleId, onApplySuggestion }: Props) {
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([]);

  useEffect(() => {
    if (!vehicleId) return;
    fetch(`/api/vehicles/${vehicleId}/service-suggestions`)
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((data) => setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 5) : []))
      .catch(() => setSuggestions([]));
  }, [vehicleId, logs.length]);

  const now = Date.now();
  const upcoming = logs
    .filter((log) => {
      if (log.nextDueDate) {
        const due = new Date(log.nextDueDate).getTime();
        if (due >= now && due <= now + 90 * 24 * 60 * 60 * 1000) return true;
      }
      return false;
    })
    .slice(0, 5);

  if (upcoming.length === 0 && suggestions.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      {suggestions.length > 0 ? (
        <>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-400">
            <Wrench className="h-4 w-4" />
            Due soon
          </h2>
          <ul className="mb-4 space-y-2">
            {suggestions.map((s) => (
              <li key={s.category} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{s.label}</p>
                    <p className="text-xs text-zinc-500">{s.reason}</p>
                  </div>
                  {onApplySuggestion ? (
                    <button
                      type="button"
                      onClick={() => onApplySuggestion(s)}
                      className="shrink-0 text-xs text-amber-400 hover:text-amber-300"
                    >
                      Log
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {upcoming.length > 0 ? (
        <>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Upcoming service reminders
          </h2>
          <ul className="space-y-2">
            {upcoming.map((log) => (
              <li key={log.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm">
                <p className="font-medium text-white">{log.title}</p>
                <p className="text-xs text-zinc-500">
                  {log.nextDueDate
                    ? `Due ${new Date(log.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : null}
                  {log.nextDueMileage ? ` · at ${log.nextDueMileage.toLocaleString()} mi` : null}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
