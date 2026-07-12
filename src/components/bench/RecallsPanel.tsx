"use client";

import type { Vehicle } from "@/lib/types";
import { ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Recall = {
  NHTSACampaignNumber?: string;
  Component?: string;
  Summary?: string;
};

type Props = {
  vehicleId: string;
  vehicle: Pick<Vehicle, "year" | "make" | "model">;
};

export function RecallsPanel({ vehicleId, vehicle }: Props) {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/vehicles/${vehicleId}/recalls`);
    if (!res.ok) {
      setRecalls([]);
      return;
    }
    const data = await res.json();
    setRecalls(Array.isArray(data.recalls) ? data.recalls.slice(0, 5) : []);
    setAcknowledged(Array.isArray(data.acknowledged) ? data.acknowledged : []);
  }, [vehicleId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function acknowledge(campaignNumber: string) {
    const res = await fetch(`/api/vehicles/${vehicleId}/recalls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignNumber }),
    });
    if (res.ok) {
      setAcknowledged((prev) => [...prev, campaignNumber]);
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        <ShieldAlert className="h-4 w-4 text-amber-400" />
        Recall check (NHTSA)
      </h2>
      <p className="mb-3 text-xs text-zinc-500">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </p>
      {loading ? (
        <p className="text-sm text-zinc-500">Checking recalls...</p>
      ) : recalls.length === 0 ? (
        <p className="text-sm text-zinc-500">No open recalls found for this vehicle.</p>
      ) : (
        <ul className="space-y-2">
          {recalls.map((recall, i) => {
            const campaign = recall.NHTSACampaignNumber ?? "";
            const isNew = campaign && !acknowledged.includes(campaign);
            return (
              <li
                key={campaign || i}
                className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-amber-400">
                    {recall.Component ?? "Recall"}
                    {isNew ? (
                      <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                        New
                      </span>
                    ) : null}
                  </p>
                  {isNew && campaign ? (
                    <button
                      type="button"
                      onClick={() => acknowledge(campaign)}
                      className="shrink-0 text-[11px] text-zinc-400 hover:text-amber-400"
                    >
                      Dismiss
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-zinc-400 line-clamp-3">{recall.Summary}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
