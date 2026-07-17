"use client";

import { SCENE_TAGS } from "@/lib/scene-tags";
import { useEffect, useState } from "react";

export function ScenePicker({ onSave }: { onSave?: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        const raw = data?.settings?.sceneTags;
        const tags: string[] = Array.isArray(raw)
          ? raw
          : typeof raw === "string"
            ? (() => {
                try {
                  const parsed = JSON.parse(raw);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            : [];
        if (!cancelled && tags.length > 0) setSaved(true);
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function save() {
    if (selected.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {},
          settings: { sceneTags: JSON.stringify(selected) },
        }),
      });
      if (!res.ok) {
        setError("Couldn’t save scenes. Try again.");
        return;
      }
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneTags: selected }),
      }).catch(() => null);
      setSaved(true);
      onSave?.();
    } catch {
      setError("Couldn’t save scenes. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking || saved) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-white">Pick your scene</h3>
      <p className="mt-1 text-xs text-zinc-500">We&apos;ll tailor your feed and local badge</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SCENE_TAGS.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selected.includes(tag.id) ? "bg-amber-500 text-zinc-950" : "border border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <button
        type="button"
        onClick={save}
        disabled={loading || selected.length === 0}
        className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save scenes"}
      </button>
    </div>
  );
}
