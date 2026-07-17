"use client";

import { useAuth } from "@/lib/auth-context";
import { FolderPlus, EyeOff, Flag, MoreHorizontal, Sparkles, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SaveToCollectionModal } from "@/components/feed/SaveToCollectionModal";
import { ShareToStoryButton } from "@/components/share/ShareToStoryButton";

type Props = {
  postId: string;
  authorId: string;
  authorUsername: string;
  postImageUrl?: string;
  postCaption?: string;
  authorDisplayName?: string;
  onHidden?: () => void;
  onMuted?: () => void;
};

export function PostFeedMenu({
  postId,
  authorId,
  authorUsername,
  postImageUrl,
  postCaption,
  authorDisplayName,
  onHidden,
  onMuted,
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;

  async function hidePost() {
    setOpen(false);
    try {
      const res = await fetch(`/api/posts/${postId}/hide`, { method: "POST" });
      if (res.ok) onHidden?.();
      else window.alert("Couldn’t hide this post. Try again.");
    } catch {
      window.alert("Couldn’t hide this post. Try again.");
    }
  }

  async function muteAuthor() {
    setOpen(false);
    try {
      const res = await fetch(`/api/users/mute/${authorId}`, { method: "POST" });
      if (res.ok) onMuted?.();
      else window.alert("Couldn’t mute this user. Try again.");
    } catch {
      window.alert("Couldn’t mute this user. Try again.");
    }
  }

  async function reportPost() {
    setOpen(false);
    const reason = window.prompt("Report reason (spam, harassment, inappropriate, scam, other)", "spam");
    if (!reason) return;
    try {
      const res = await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) window.alert("Report submitted. Thanks for helping keep GearNet safe.");
      else window.alert("Couldn’t submit report. Try again.");
    } catch {
      window.alert("Couldn’t submit report. Try again.");
    }
  }

  return (
    <>
      <div ref={ref} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Feed options"
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {open ? (
          <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
            {postImageUrl ? (
              <ShareToStoryButton
                kind="post"
                postId={postId}
                imageUrl={postImageUrl}
                username={authorUsername}
                displayName={authorDisplayName ?? authorUsername}
                caption={postCaption ?? ""}
              />
            ) : null}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("gearnet-inspired-by", postId);
                  window.location.href = "/explore?createPost=1";
                }
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <Sparkles className="h-4 w-4" /> Inspired by this
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCollectionsOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <FolderPlus className="h-4 w-4" /> Save to collection
            </button>
            <button
              type="button"
              onClick={() => void hidePost()}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <EyeOff className="h-4 w-4" /> Hide post
            </button>
            <button
              type="button"
              onClick={() => void muteAuthor()}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <VolumeX className="h-4 w-4" /> Mute @{authorUsername}
            </button>
            <button
              type="button"
              onClick={() => void reportPost()}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
            >
              <Flag className="h-4 w-4" /> Report post
            </button>
          </div>
        ) : null}
      </div>
      <SaveToCollectionModal postId={postId} open={collectionsOpen} onClose={() => setCollectionsOpen(false)} />
    </>
  );
}
