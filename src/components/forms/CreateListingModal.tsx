"use client";

import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type EditingListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  tradeAccepted: boolean;
  images: string[];
};
type Props = { open: boolean; onClose: () => void; editing?: EditingListing };

const categories = ["vehicle", "parts", "wheels", "accessories", "trade"];
const conditions = ["new", "like-new", "good", "fair", "project"];

export function CreateListingModal({ open, onClose, editing }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("parts");
  const [condition, setCondition] = useState("good");
  const [location, setLocation] = useState("");
  const [tradeAccepted, setTradeAccepted] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setPrice(editing ? String(editing.price) : "");
    setCategory(editing?.category ?? "parts");
    setCondition(editing?.condition ?? "good");
    setLocation(editing?.location ?? "");
    setTradeAccepted(editing?.tradeAccepted ?? false);
    setImages(editing?.images ?? []);
    setError("");
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(editing ? `/api/marketplace/${editing.id}` : "/api/marketplace", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: parseInt(price, 10),
          category,
          condition,
          location: location.trim(),
          tradeAccepted,
          images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d1?w=800&h=600&fit=crop"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save listing");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save listing");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none";

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Listing" : "List Item"}>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Price ($)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} required />
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
            <label className="mb-1 block text-sm text-zinc-400">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className={inputClass}>
              {conditions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={tradeAccepted} onChange={(e) => setTradeAccepted(e.target.checked)} />
          Open to trades
        </label>
        <MultiImageUpload images={images} onChange={setImages} label="Add listing photos" maxImages={8} />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50">
          {loading ? "Saving..." : editing ? "Save Changes" : "Publish Listing"}
        </button>
      </form>
    </Modal>
  );
}
