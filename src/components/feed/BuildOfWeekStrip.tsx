"use client";

import type { Post } from "@/lib/types";
import { Trophy } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  onOpen?: (postId: string) => void;
};

export function BuildOfWeekStrip({ onOpen }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError("");
    fetch("/api/discover/build-of-week")
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error || "Couldn’t load build of the week");
        }
        return r.json();
      })
      .then((data) => setPost(data.post ?? null))
      .catch((err) => {
        setPost(null);
        setError(err instanceof Error ? err.message : "Couldn’t load build of the week");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return null;
  if (error) {
    return (
      <section className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 px-3 py-2">
        <p className="text-xs text-red-400">{error}</p>
        <button type="button" onClick={load} className="text-xs text-amber-400 hover:underline">
          Retry
        </button>
      </section>
    );
  }
  if (!post?.user) return null;

  const image = post.images?.[0] ?? post.image;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-white">Build of the Week</h2>
      </div>
      <button
        type="button"
        onClick={() => onOpen?.(post.id)}
        className="flex w-full overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-zinc-900/80 text-left transition-colors hover:border-amber-500/50"
      >
        <div className="relative h-24 w-24 shrink-0 bg-zinc-800">
          <Image src={image} alt="" fill className="object-cover" sizes="96px" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Featured build</p>
          <p className="truncate text-sm font-semibold text-white">@{post.user.username}</p>
          <p className="line-clamp-2 text-xs text-zinc-400">{post.caption || "Tap to view"}</p>
        </div>
      </button>
    </section>
  );
}
