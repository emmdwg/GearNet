"use client";

import { ImageUrlField } from "@/components/ui/ImageUrlField";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { open: boolean; onClose: () => void };

export function CreateEventModal({ open, onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          city: city.trim(),
          date,
          time: time.trim(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          image: image || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=400&fit=crop",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create event");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none";

  return (
    <Modal open={open} onClose={onClose} title="Create Event">
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
            <label className="mb-1 block text-sm text-zinc-400">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Time</label>
            <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="7:00 PM" className={inputClass} required />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Tags (comma separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Meet, Cars & Coffee" className={inputClass} />
        </div>
        <ImageUrlField value={image} onChange={setImage} />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50">
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>
    </Modal>
  );
}
