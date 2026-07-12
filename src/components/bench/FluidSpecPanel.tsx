"use client";

import type { Vehicle } from "@/lib/types";
import { Droplets } from "lucide-react";
import { useState } from "react";

const TEMPLATE = `Oil weight:
Coolant:
Transmission:
Brake fluid:
`;

type Props = {
  vehicles: Vehicle[];
  onSaved?: () => void;
};

export function FluidSpecPanel({ vehicles, onSaved }: Props) {
  const [selectedId, setSelectedId] = useState(vehicles[0]?.id ?? "");
  const [notes, setNotes] = useState(vehicles[0]?.fluidNotes ?? TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selected = vehicles.find((v) => v.id === selectedId);

  function selectVehicle(id: string) {
    setSelectedId(id);
    const vehicle = vehicles.find((v) => v.id === id);
    setNotes(vehicle?.fluidNotes?.trim() ? vehicle.fluidNotes : TEMPLATE);
    setMessage("");
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/vehicles/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fluidNotes: notes.trim() || null }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Fluid specs saved");
      onSaved?.();
    } catch {
      setMessage("Could not save fluid specs");
    } finally {
      setSaving(false);
    }
  }

  if (vehicles.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        <Droplets className="h-4 w-4 text-sky-400" />
        Fluid spec cheat sheet
      </h2>
      <p className="mb-3 text-xs text-zinc-500">Oil weight, coolant, and other fluids for quick reference.</p>
      {vehicles.length > 1 ? (
        <select
          value={selectedId}
          onChange={(e) => selectVehicle(e.target.value)}
          className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.year} {v.make} {v.model}
            </option>
          ))}
        </select>
      ) : selected ? (
        <p className="mb-3 text-xs text-zinc-400">
          {selected.year} {selected.make} {selected.model}
        </p>
      ) : null}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save notes"}
        </button>
        {message ? <span className="text-xs text-zinc-500">{message}</span> : null}
      </div>
    </section>
  );
}
