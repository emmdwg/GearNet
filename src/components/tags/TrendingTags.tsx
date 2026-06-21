"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TrendingTag = { tag: string; count: number };

export function TrendingTags({ compact = false }: { compact?: boolean }) {
  const [tags, setTags] = useState<TrendingTag[]>([]);

  useEffect(() => {
    fetch("/api/tags/trending")
      .then((r) => r.json())
      .then((json) => setTags(json.tags ?? []))
      .catch(() => setTags([]));
  }, []);

  if (tags.length === 0) return null;

  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/40 ${compact ? "p-3" : "p-4"}`}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Trending Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag, count }) => (
          <Link
            key={tag}
            href={`/tag/${encodeURIComponent(tag)}`}
            className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-sm text-zinc-300 transition-colors hover:border-amber-500/50 hover:text-amber-400"
          >
            #{tag}
            <span className="ml-1.5 text-xs text-zinc-600">{count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
