"use client";

import { CommentThread, type CommentItem } from "@/components/social/CommentThread";
import { RichText } from "@/components/ui/RichText";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { formatRelativeDate } from "@/lib/utils";
import { Heart, MessageSquare, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type PostDetail = {
  id: string;
  image: string;
  images: string[];
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatar: string };
  commentList: CommentItem[];
};

export function PostViewer({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [data, setData] = useState<PostDetail | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/posts/${postId}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Failed to load post");
        setData(json);
        setLikes(json.likes ?? 0);
        setLiked(json.liked ?? false);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load post"))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function toggleLike() {
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "post", targetId: postId }),
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
      body: JSON.stringify({ targetType: "post", targetId: postId, content: comment.trim() }),
    });
    if (!res.ok) return;
    const created = await res.json();
    setData((prev) =>
      prev
        ? {
            ...prev,
            commentList: [...prev.commentList, created],
            comments: prev.comments + 1,
          }
        : prev
    );
    setComment("");
  }

  async function submitReply(parentId: string, content: string) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "post", targetId: postId, content, parentId }),
    });
    if (!res.ok) return;
    // Reload comments for threaded structure
    const listRes = await fetch(`/api/comments?targetType=post&targetId=${postId}`);
    if (listRes.ok) {
      const list = await listRes.json();
      setData((prev) => (prev ? { ...prev, commentList: list, comments: prev.comments + 1 } : prev));
    }
  }

  async function likeComment(commentId: string) {
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "comment", targetId: commentId }),
    });
    if (!res.ok) return { liked: false };
    return res.json();
  }

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-zinc-400 hover:text-white">
          <X className="h-6 w-6" />
        </button>
        <p className="text-zinc-400">{loading ? "Loading post..." : error || "Post not found"}</p>
      </div>
    );
  }

  const images = data.images?.length > 0 ? data.images : [data.image];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 p-0 sm:p-4" onClick={onClose}>
      <div
        className="grid h-full w-full max-w-5xl overflow-hidden bg-zinc-950 sm:h-auto sm:max-h-[90vh] sm:rounded-xl sm:border sm:border-zinc-800 lg:grid-cols-[1.2fr_0.8fr]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-[50vh] min-h-[320px] bg-black lg:h-full lg:min-h-[480px]">
          <ImageCarousel images={images} alt={data.caption} variant="viewer" className="h-full" />
        </div>

        <div className="flex max-h-[55vh] flex-col sm:max-h-[80vh]">
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <Link href={`/profile/${data.user.username}`} className="flex items-center gap-3">
              <Avatar src={data.user.avatar} alt={data.user.displayName} size="sm" />
              <div>
                <p className="font-medium text-white">{data.user.displayName}</p>
                <p className="text-xs text-zinc-500">
                  @{data.user.username} · {formatRelativeDate(data.createdAt)}
                </p>
              </div>
            </Link>
            <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-zinc-800 px-4 py-3">
            <RichText text={data.caption} className="text-sm leading-relaxed text-zinc-200" />
            {data.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.tags.map((t) => (
                  <Link key={t} href={`/tag/${encodeURIComponent(t)}`}>
                    <Badge variant="accent">#{t}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <CommentThread
              comments={data.commentList}
              onReply={submitReply}
              onLike={likeComment}
            />
          </div>

          <div className="border-t border-zinc-800 p-4">
            <div className="mb-3 flex items-center gap-4 text-sm text-zinc-400">
              <button type="button" onClick={toggleLike} className={`flex items-center gap-1 ${liked ? "text-red-400" : ""}`}>
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes}
              </button>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> {data.comments}
              </span>
              <BookmarkButton
                targetType="post"
                targetId={postId}
                initialSaved={data.bookmarked}
                withLabel
                className="ml-auto flex items-center gap-1.5 transition-colors hover:text-amber-400"
              />
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
