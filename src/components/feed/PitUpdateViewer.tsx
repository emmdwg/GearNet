"use client";

import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeDate } from "@/lib/utils";
import { Heart, MessageSquare, Send, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type PitDetail = {
  id: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  liked: boolean;
  user: { id: string; username: string; displayName: string; avatar: string };
  commentList: {
    id: string;
    content: string;
    createdAt: string;
    user: { username: string; displayName: string; avatar: string };
  }[];
};

export function PitUpdateViewer({ updateId, onClose }: { updateId: string; onClose: () => void }) {
  const [data, setData] = useState<PitDetail | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pit-updates/${updateId}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLikes(json.likes ?? 0);
        setLiked(json.liked ?? false);
      })
      .finally(() => setLoading(false));
  }, [updateId]);

  async function toggleLike() {
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "pit_update", targetId: updateId }),
    });
    if (!res.ok) return;
    const result = await res.json();
    setLiked(result.liked);
    setLikes((n) => (result.liked ? n + 1 : Math.max(0, n - 1)));
  }

  async function submitComment() {
    if (!comment.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "pit_update", targetId: updateId, content: comment.trim() }),
    });
    if (!res.ok) return;
    const created = await res.json();
    setData((prev) =>
      prev ? { ...prev, commentList: [...prev.commentList, created], comments: prev.comments + 1 } : prev
    );
    setComment("");
  }

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90">
        <p className="text-zinc-400">Loading pit update...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[50vh] bg-black lg:min-h-[80vh]">
          <Image src={data.image} alt={data.caption} fill className="object-contain" sizes="100vw" />
        </div>
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <Link href={`/profile/${data.user.username}`} className="flex items-center gap-3">
              <Avatar src={data.user.avatar} alt={data.user.displayName} size="sm" />
              <div>
                <p className="font-medium text-white">{data.user.displayName}</p>
                <p className="text-xs text-zinc-500">@{data.user.username}</p>
              </div>
            </Link>
            <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="text-sm text-zinc-200">{data.caption}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {data.commentList.map((item) => (
              <div key={item.id} className="text-sm">
                <span className="font-medium text-white">{item.user.displayName}</span>{" "}
                <span className="text-zinc-300">{item.content}</span>
                <p className="text-[10px] text-zinc-600">{formatRelativeDate(item.createdAt)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 p-4">
            <div className="mb-3 flex items-center gap-4 text-sm text-zinc-400">
              <button type="button" onClick={toggleLike} className={`flex items-center gap-1 ${liked ? "text-red-400" : ""}`}>
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes}
              </button>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> {data.comments}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
              />
              <button type="button" onClick={submitComment} className="rounded-lg bg-amber-500 px-3 text-zinc-950">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
