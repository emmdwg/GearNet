"use client";

import type { MaintenanceLog } from "@/lib/types";

type Props = {
  logs: MaintenanceLog[];
  vehicleId?: string;
};

export function OdometerChart({ logs, vehicleId }: Props) {
  const points = logs
    .filter((l) => (vehicleId ? l.vehicleId === vehicleId : true))
    .map((l) => ({ mileage: l.mileage, date: l.performedAt, title: l.title }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (points.length < 2) return null;

  const minMileage = Math.min(...points.map((p) => p.mileage));
  const maxMileage = Math.max(...points.map((p) => p.mileage));
  const range = Math.max(maxMileage - minMileage, 1);

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Mileage over time</h2>
      <div className="space-y-2">
        {points.map((point) => (
          <div key={`${point.date}-${point.mileage}`} className="flex items-center gap-3 text-xs">
            <span className="w-20 shrink-0 text-zinc-500">
              {new Date(point.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${((point.mileage - minMileage) / range) * 100}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-zinc-300">{point.mileage.toLocaleString()} mi</span>
          </div>
        ))}
      </div>
    </section>
  );
}
