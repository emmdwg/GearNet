"use client";

import { ImageUrlField } from "@/components/ui/ImageUrlField";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { open: boolean; onClose: () => void };

export function CreatePitUpdateModal({ open, onClose }: Props) {
  const router = useRouter();
  const [image, setImage] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!image || !caption.trim()) {
      setError("Image and caption are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pit-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, caption: caption.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add pit update");
      onClose();
      setImage("");
      setCaption("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add pit update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Pit Update">
      <p className="mb-4 text-sm text-zinc-500">Share a 24-hour snapshot from your garage.</p>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <ImageUrlField value={image} onChange={setImage} />
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Caption</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={80}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50">
          {loading ? "Posting..." : "Share Update"}
        </button>
      </form>
    </Modal>
  );
}
