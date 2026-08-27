"use client";

import { PostCard } from "@/components/feed/PostCard";
import type { Post } from "@/lib/types";
import { Plus } from "lucide-react";

export function ClubFeed({
  posts,
  canPost,
  onShare,
}: {
  posts: Post[];
  canPost: boolean;
  onShare: () => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">Club posts</h2>
          <p className="text-xs text-zinc-500">Builds and updates from this crew</p>
        </div>
        {canPost ? (
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Post
          </button>
        ) : null}
      </div>
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-10 text-center text-sm text-zinc-500">
          No club posts yet.{canPost ? " Share the first one." : ""}
        </div>
      )}
    </section>
  );
}
