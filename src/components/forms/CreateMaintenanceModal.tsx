"use client";

import { Modal } from "@/components/ui/Modal";
import type { Vehicle } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  vehicles: Pick<Vehicle, "id" | "year" | "make" | "model">[];
};

const categories = ["Oil Change", "Brakes", "Tires", "Engine", "Suspension", "Detailing", "Other"];

export function CreateMaintenanceModal({ open, onClose, vehicles }: Props) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState("Other");
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId) {
      setError("Add a vehicle to your garage first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          title: title.trim(),
          description: description.trim(),
          mileage: parseInt(mileage, 10) || 0,
          cost: cost ? parseInt(cost, 10) : undefined,
          category,
          performedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to log service");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log service");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none";

  return (
    <Modal open={open} onClose={onClose} title="Log Service">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        {vehicles.length === 0 ? (
          <p className="text-sm text-zinc-500">Add a vehicle in your garage before logging service.</p>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Vehicle</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputClass}>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Service Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Mileage</label>
                <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Cost ($)</label>
                <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Date</label>
                <input type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} className={inputClass} required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50">
              {loading ? "Saving..." : "Save Service Record"}
            </button>
          </>
        )}
      </form>
    </Modal>
  );
}
