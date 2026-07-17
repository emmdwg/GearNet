"use client";

import type { CreatorLink } from "@/lib/types";
import { Check, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function CreatorLinksEditor() {
  const [links, setLinks] = useState<CreatorLink[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/creator-links");
    if (!res.ok) return;
    const data = await res.json();
    setLinks(data.links ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addLink() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/creator-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setTitle("");
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeLink(id: string) {
    setError("");
    await fetch(`/api/creator-links/${id}`, { method: "DELETE" });
    await load();
  }

  function startEdit(link: CreatorLink) {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setError("");
  }

  async function saveEdit(id: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/creator-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, url: editUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function moveLink(id: string, direction: -1 | 1) {
    const index = links.findIndex((l) => l.id === id);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= links.length) return;
    const a = links[index];
    const b = links[swapWith];
    setError("");
    await Promise.all([
      fetch(`/api/creator-links/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/creator-links/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);
    await load();
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-sm font-semibold text-white">Link in bio</h2>
      <p className="mt-1 text-xs text-zinc-500">Up to 8 https links on your public profile.</p>

      <ul className="mt-3 space-y-2">
        {links.map((link, index) => (
          <li
            key={link.id}
            className="rounded-lg border border-zinc-800 px-3 py-2 text-sm"
          >
            {editingId === link.id ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void saveEdit(link.id)}
                    className="rounded-lg p-2 text-amber-400 hover:bg-zinc-800 disabled:opacity-50"
                    aria-label="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-amber-400 hover:underline"
                >
                  {link.title}
                </a>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => void moveLink(link.id, -1)}
                    className="px-1.5 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === links.length - 1}
                    onClick={() => void moveLink(link.id, 1)}
                    className="px-1.5 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(link)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeLink(link.id)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Label"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          disabled={loading || !title.trim() || !url.trim() || links.length >= 8}
          onClick={() => void addLink()}
          className="flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      {links.length === 0 ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-zinc-600">
          <ExternalLink className="h-3 w-3" />
          No links yet
        </p>
      ) : null}
    </section>
  );
}
