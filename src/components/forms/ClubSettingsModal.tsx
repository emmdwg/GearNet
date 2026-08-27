"use client";

import { Modal } from "@/components/ui/Modal";
import type { Club, ClubMember } from "@/lib/types";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  club: Club;
  members: ClubMember[];
  isOwner: boolean;
  onUpdated: () => void;
};

export function ClubSettingsModal({ open, onClose, club, isOwner, onUpdated }: Props) {
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description);
  const [city, setCity] = useState(club.city ?? "");
  const [merchUrl, setMerchUrl] = useState(club.merchUrl ?? "");
  const [isPublic, setIsPublic] = useState(club.isPublic);
  const [requiresApproval, setRequiresApproval] = useState(club.requiresApproval);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/clubs/${club.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          city: city.trim(),
          merchUrl: merchUrl.trim(),
          isPublic,
          requiresApproval,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none";

  return (
    <Modal open={open} onClose={onClose} title="Club settings">
      <form onSubmit={submit} className="space-y-4">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputClass} />
        <input value={merchUrl} onChange={(e) => setMerchUrl(e.target.value)} placeholder="Merch URL" className={inputClass} />
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-amber-500" />
          Public
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
            className="accent-amber-500"
          />
          Require approval
        </label>
        {!isOwner ? <p className="text-xs text-zinc-500">Some options are owner-only.</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-amber-500 py-2.5 font-semibold text-zinc-950 disabled:opacity-50"
        >
          Save
        </button>
      </form>
    </Modal>
  );
}
