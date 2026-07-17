"use client";

import { Modal } from "@/components/ui/Modal";
import { useEffect, useState } from "react";

type Collection = {
  id: string;
  name: string;
  postIds: string[];
  count: number;
};

type Props = {
  postId: string;
  open: boolean;
  onClose: () => void;
};

export function SaveToCollectionModal({ postId, open, onClose }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setMessage("");
    fetch("/api/collections")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => setCollections([]));
  }, [open]);

  async function addToCollection(collectionId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setMessage("Saved!");
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId ? { ...c, postIds: [...c.postIds, postId], count: c.count + 1 } : c
          )
        );
      } else {
        setMessage("Couldn’t save to collection.");
      }
    } catch {
      setMessage("Couldn’t save to collection.");
    } finally {
      setLoading(false);
    }
  }

  async function createAndSave() {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setMessage("Couldn’t create collection.");
        return;
      }
      const created = await res.json();
      setNewName("");
      setCollections((prev) => [created, ...prev]);
      await addToCollection(created.id);
    } catch {
      setMessage("Couldn’t create collection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Save to collection">
      <div className="space-y-3">
        {collections.length === 0 ? (
          <p className="text-sm text-zinc-500">No collections yet. Create one below.</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {collections.map((c) => {
              const saved = c.postIds.includes(postId);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={loading || saved}
                    onClick={() => void addToCollection(c.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 text-left text-sm text-zinc-200 hover:border-zinc-600 disabled:opacity-50"
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-zinc-500">{saved ? "Saved" : `${c.count} posts`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New collection name"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={loading || !newName.trim()}
            onClick={() => void createAndSave()}
            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            Create
          </button>
        </div>
        {message ? <p className="text-sm text-amber-400">{message}</p> : null}
      </div>
    </Modal>
  );
}
