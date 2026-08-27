"use client";

import type { Club } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

export function ClubChaptersSection({
  slug,
  chapters,
  parentClub,
  canManage,
  onChapterCreated,
}: {
  slug: string;
  chapters: Array<{ id: string; slug: string; name: string; city?: string | null; memberCount: number; image?: string | null }>;
  parentClub?: { id: string; slug: string; name: string; city?: string | null } | null;
  canManage: boolean;
  onChapterCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);

  async function createChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/clubs/${slug}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), city: city.trim() }),
      });
      if (res.ok) {
        setName("");
        setCity("");
        onChapterCreated();
      }
    } finally {
      setBusy(false);
    }
  }

  if (parentClub) {
    return (
      <p className="mb-4 text-xs text-zinc-500">
        Chapter of{" "}
        <Link href={`/clubs/${parentClub.slug}`} className="text-amber-400 hover:text-amber-300">
          {parentClub.name}
        </Link>
      </p>
    );
  }

  if (!canManage && chapters.length === 0) return null;

  return (
    <section className="mb-5">
      <h2 className="mb-2 text-sm font-semibold text-white">Chapters</h2>
      {chapters.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/clubs/${ch.slug}`}
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 ring-1 ring-zinc-800 hover:text-white"
            >
              {ch.name}
              {ch.city ? ` · ${ch.city}` : ""}
            </Link>
          ))}
        </div>
      ) : null}
      {canManage ? (
        <form onSubmit={createChapter} className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chapter name"
            className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-28 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-full bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      ) : null}
    </section>
  );
}
