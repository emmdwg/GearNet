"use client";

import { TrendingTags } from "@/components/tags/TrendingTags";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Post = {
  id: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  user?: { username: string; displayName: string };
};

export function TagPageClient({ tag }: { tag: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tags/${encodeURIComponent(tag)}`)
      .then((r) => r.json())
      .then((json) => setPosts(json.posts ?? []))
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <div className="mx-auto flex max-w-4xl gap-8 px-4 py-6 xl:max-w-5xl">
      <div className="min-w-0 flex-1">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-wider text-amber-400">Hashtag</p>
          <h1 className="mt-1 text-3xl font-bold text-white">#{tag}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? "Loading..." : `${posts.length} post${posts.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading ? (
          <p className="text-center text-zinc-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
            No posts with #{tag} yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/explore?post=${post.id}`}
                className="group relative aspect-square overflow-hidden bg-zinc-900"
              >
                <Image src={post.image} alt={post.caption} fill sizes="220px" className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1 text-sm font-semibold text-white">
                    <Heart className="h-4 w-4 fill-white" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-white">
                    <MessageCircle className="h-4 w-4 fill-white" />
                    {post.comments}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <aside className="hidden w-64 shrink-0 xl:block">
        <TrendingTags />
      </aside>
    </div>
  );
}
