"use client";

import { ImageUrlField } from "@/components/ui/ImageUrlField";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type EditingVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color: string;
  image: string;
};
type Props = { open: boolean; onClose: () => void; editing?: EditingVehicle };

export function CreateVehicleModal({ open, onClose, editing }: Props) {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [color, setColor] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setYear(editing ? String(editing.year) : new Date().getFullYear().toString());
    setMake(editing?.make ?? "");
    setModel(editing?.model ?? "");
    setTrim(editing?.trim ?? "");
    setColor(editing?.color ?? "");
    setImage(editing?.image ?? "");
    setError("");
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(editing ? `/api/vehicles/${editing.id}` : "/api/vehicles", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(year, 10),
          make: make.trim(),
          model: model.trim(),
          trim: trim.trim() || undefined,
          color: color.trim() || "Unknown",
          image: image || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save vehicle");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none";

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Vehicle" : "Add Vehicle"}>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Color</label>
            <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} placeholder="Black" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Make</label>
          <input value={make} onChange={(e) => setMake(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Model</label>
          <input value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Trim (optional)</label>
          <input value={trim} onChange={(e) => setTrim(e.target.value)} className={inputClass} />
        </div>
        <ImageUrlField value={image} onChange={setImage} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Saving..." : editing ? "Save Changes" : "Add to Garage"}
        </button>
      </form>
    </Modal>
  );
}
