"use client";

import Image from "next/image";
import Link from "next/link";
import { SCENE_TAGS } from "@/lib/scene-tags";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

type Props = {
  posts: Post[];
  activeScene?: string | null;
  onSceneSelect: (sceneId: string | null) => void;
};

export function BuildStyleGrid({ posts, activeScene, onSceneSelect }: Props) {
  const { user } = useAuth();
  const [followedScenes, setFollowedScenes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetch("/api/tag-follows")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { tag: string; tagType: string }[]) => {
        const scenes = new Set(
          (Array.isArray(data) ? data : []).filter((f) => f.tagType === "scene").map((f) => f.tag)
        );
        setFollowedScenes(scenes);
      })
      .catch(() => null);
  }, [user]);

  const sceneCounts = new Map<string, number>();
  for (const post of posts) {
    const authorScenes = (post.user as { sceneTags?: string[] } | undefined)?.sceneTags ?? [];
    const postTags = post.tags ?? [];
    for (const scene of SCENE_TAGS) {
      if (authorScenes.includes(scene.id) || postTags.some((t) => t.toLowerCase() === scene.id)) {
        sceneCounts.set(scene.id, (sceneCounts.get(scene.id) ?? 0) + 1);
      }
    }
  }

  const previewFor = (sceneId: string) =>
    posts.find(
      (p) =>
        (p.user as { sceneTags?: string[] } | undefined)?.sceneTags?.includes(sceneId) ||
        p.tags.some((t) => t.toLowerCase() === sceneId)
    )?.image;

  async function toggleFollow(sceneId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) {
      window.location.href = "/auth/signin";
      return;
    }
    const res = await fetch("/api/tag-follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: sceneId, tagType: "scene" }),
    });
    if (!res.ok) {
      window.alert("Couldn’t update scene follow. Try again.");
      return;
    }
    const data = await res.json();
    setFollowedScenes((prev) => {
      const next = new Set(prev);
      if (data.following) next.add(sceneId);
      else next.delete(sceneId);
      return next;
    });
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Explore by build style</h3>
        {activeScene ? (
          <button type="button" onClick={() => onSceneSelect(null)} className="text-xs text-amber-400 hover:underline">
            Clear filter
          </button>
        ) : null}
      </div>
      <div className="columns-2 gap-2 sm:columns-3">
        {SCENE_TAGS.map((scene) => {
          const count = sceneCounts.get(scene.id) ?? 0;
          const preview = previewFor(scene.id);
          const active = activeScene === scene.id;
          const following = followedScenes.has(scene.id);
          return (
            <div
              key={scene.id}
              className={cn(
                "mb-2 block w-full break-inside-avoid overflow-hidden rounded-xl border text-left transition-colors",
                active ? "border-amber-500 ring-1 ring-amber-500/40" : "border-zinc-800 hover:border-zinc-600"
              )}
            >
              <button type="button" onClick={() => onSceneSelect(active ? null : scene.id)} className="block w-full text-left">
                <div className="relative aspect-[4/3] bg-zinc-800">
                  {preview ? (
                    <Image src={preview} alt={scene.label} fill className="object-cover" sizes="200px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-600">No posts yet</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-sm font-semibold text-white">{scene.label}</p>
                    <p className="text-[10px] text-zinc-400">{count} posts</p>
                  </div>
                </div>
              </button>
              {user ? (
                <div className="border-t border-zinc-800 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={(e) => void toggleFollow(scene.id, e)}
                    className={cn(
                      "w-full rounded-md py-1 text-[10px] font-semibold",
                      following ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    {following ? "Following scene" : "Follow scene"}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {activeScene ? (
        <p className="mt-2 text-xs text-zinc-500">
          Showing {SCENE_TAGS.find((s) => s.id === activeScene)?.label} builds.{" "}
          <Link href={`/tag/${activeScene}`} className="text-amber-400 hover:underline">
            View tag page →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
