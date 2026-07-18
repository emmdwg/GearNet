"use client";

import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { Modal } from "@/components/ui/Modal";
import { PROJECT_STATUSES } from "@/lib/vehicle-meta";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop";

type EditingVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color: string;
  image: string;
  images?: string[];
  vin?: string;
  projectStatus?: string;
  buildProgress?: number;
  installHours?: number;
  waitingOnParts?: boolean;
  waitingOnPartsNote?: string;
  forSale?: boolean;
};
type Props = { open: boolean; onClose: () => void; editing?: EditingVehicle };

export function CreateVehicleModal({ open, onClose, editing }: Props) {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [color, setColor] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [vin, setVin] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [buildProgress, setBuildProgress] = useState("0");
  const [installHours, setInstallHours] = useState("");
  const [waitingOnParts, setWaitingOnParts] = useState(false);
  const [waitingOnPartsNote, setWaitingOnPartsNote] = useState("");
  const [forSale, setForSale] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setYear(editing ? String(editing.year) : new Date().getFullYear().toString());
    setMake(editing?.make ?? "");
    setModel(editing?.model ?? "");
    setTrim(editing?.trim ?? "");
    setColor(editing?.color ?? "");
    const gallery =
      editing?.images && editing.images.length > 0
        ? editing.images
        : editing?.image
          ? [editing.image]
          : [];
    setImages(gallery);
    setVin(editing?.vin ?? "");
    setProjectStatus(editing?.projectStatus ?? "");
    setBuildProgress(String(editing?.buildProgress ?? 0));
    setInstallHours(
      typeof editing?.installHours === "number" ? String(editing.installHours) : "",
    );
    setWaitingOnParts(editing?.waitingOnParts ?? false);
    setWaitingOnPartsNote(editing?.waitingOnPartsNote ?? "");
    setForSale(editing?.forSale ?? false);
    setError("");
  }, [open, editing]);

  async function decodeVin() {
    if (!vin.trim()) return;
    setDecoding(true);
    setError("");
    try {
      const res = await fetch("/api/vehicles/decode-vin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: vin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Decode failed");
      if (data.year) setYear(String(data.year));
      if (data.make) setMake(data.make);
      if (data.model) setModel(data.model);
      if (data.trim) setTrim(data.trim);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not decode VIN");
    } finally {
      setDecoding(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const hoursParsed = installHours.trim() === "" ? null : Number(installHours);
      const gallery = images.filter(Boolean);
      const primary = gallery[0] || FALLBACK_IMAGE;
      const payload = {
        year: parseInt(year, 10),
        make: make.trim(),
        model: model.trim(),
        trim: trim.trim() || undefined,
        color: color.trim() || "Unknown",
        image: primary,
        images: gallery.length > 0 ? gallery : [primary],
        vin: vin.trim() || undefined,
        projectStatus: projectStatus || undefined,
        buildProgress: parseInt(buildProgress, 10) || 0,
        installHours:
          hoursParsed !== null && !Number.isNaN(hoursParsed) ? Math.round(hoursParsed) : null,
        waitingOnParts,
        waitingOnPartsNote: waitingOnParts ? waitingOnPartsNote.trim() || null : null,
        forSale,
      };
      const res = await fetch(editing ? `/api/vehicles/${editing.id}` : "/api/vehicles", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <div>
          <label className="mb-1 block text-sm text-zinc-400">VIN (optional)</label>
          <div className="flex gap-2">
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              className={inputClass}
              placeholder="17-character VIN"
              maxLength={17}
            />
            <button
              type="button"
              onClick={() => void decodeVin()}
              disabled={decoding || !vin.trim()}
              className="shrink-0 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:border-zinc-600 disabled:opacity-50"
            >
              {decoding ? "..." : "Decode"}
            </button>
          </div>
        </div>
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
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Project status</label>
          <select
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value)}
            className={inputClass}
          >
            <option value="">Not set</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">
            Build progress: {buildProgress}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={buildProgress}
            onChange={(e) => setBuildProgress(e.target.value)}
            className="w-full accent-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Install hours (optional)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={installHours}
            onChange={(e) => setInstallHours(e.target.value)}
            className={inputClass}
            placeholder="e.g. 40"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={waitingOnParts}
            onChange={(e) => setWaitingOnParts(e.target.checked)}
          />
          Waiting on parts
        </label>
        {waitingOnParts ? (
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Waiting note (optional)</label>
            <input
              value={waitingOnPartsNote}
              onChange={(e) => setWaitingOnPartsNote(e.target.value)}
              className={inputClass}
              placeholder="What’s delayed?"
              maxLength={200}
            />
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Photos</label>
          <MultiImageUpload images={images} onChange={setImages} maxImages={8} folder="vehicles" />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={forSale} onChange={(e) => setForSale(e.target.checked)} />
          List this project for sale
        </label>
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
