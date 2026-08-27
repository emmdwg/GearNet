"use client";

import type { ClubProject } from "@/lib/types";
import { useEffect, useState } from "react";

export function ClubProjectsPanel({ slug, canManage }: { slug: string; canManage: boolean }) {
  const [projects, setProjects] = useState<ClubProject[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch(`/api/clubs/${slug}/projects`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [slug]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/clubs/${slug}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setProjects((prev) => [data, ...prev]);
      setTitle("");
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-white">Club project</h2>
      {canManage ? (
        <form onSubmit={createProject} className="mb-4 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      ) : null}
      {projects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-800 px-6 py-10 text-center text-sm text-zinc-500">
          No group builds yet.
        </p>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="font-medium text-white">{p.title}</p>
              {p.description ? <p className="mt-1 text-sm text-zinc-500">{p.description}</p> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
