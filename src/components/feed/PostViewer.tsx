"use client";

import { CommentThread, type CommentItem } from "@/components/social/CommentThread";
import { RichText } from "@/components/ui/RichText";
import { PostMedia } from "@/components/ui/PostMedia";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeDate } from "@/lib/utils";
import { Flame, MessageSquare, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type PostDetail = {
  id: string;
  image: string;
  images: string[];
  mediaType?: string;
  videoUrl?: string;
  videoDuration?: number;
  videoPoster?: string;
  videoChapters?: { timeSec: number; label: string }[];
  postType?: string;
  beforeImage?: string | null;
  afterImage?: string | null;
  audioUrl?: string | null;
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
  const { user } = useAuth();
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
    if (!user) {
      window.location.href = `/auth/signin?callbackUrl=/explore?post=${postId}`;
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetId: postId }),
      });
      if (!res.ok) {
        setError("Couldn’t update like. Try again.");
        return;
      }
      const result = await res.json();
      setLiked(result.liked);
      setLikes((n) => (result.liked ? n + 1 : Math.max(0, n - 1)));
    } catch {
      setError("Couldn’t update like. Try again.");
    }
  }

  async function submitComment() {
    if (!comment.trim()) return;
    if (!user) {
      window.location.href = `/auth/signin?callbackUrl=/explore?post=${postId}`;
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetId: postId, content: comment.trim() }),
      });
      if (!res.ok) {
        setError("Couldn’t post comment. Try again.");
        return;
      }
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
    } catch {
      setError("Couldn’t post comment. Try again.");
    }
  }

  async function submitReply(parentId: string, content: string, quotedCommentId?: string) {
    if (!user) {
      window.location.href = `/auth/signin?callbackUrl=/explore?post=${postId}`;
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetId: postId, content, parentId, quotedCommentId }),
      });
      if (!res.ok) {
        setError("Couldn’t post reply. Try again.");
        return;
      }
      // Reload comments for threaded structure
      const listRes = await fetch(`/api/comments?targetType=post&targetId=${postId}`);
      if (listRes.ok) {
        const list = await listRes.json();
        setData((prev) => (prev ? { ...prev, commentList: list, comments: prev.comments + 1 } : prev));
      }
    } catch {
      setError("Couldn’t post reply. Try again.");
    }
  }

  async function likeComment(commentId: string) {
    if (!user) {
      window.location.href = `/auth/signin?callbackUrl=/explore?post=${postId}`;
      return { liked: false };
    }
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "comment", targetId: commentId }),
    });
    if (!res.ok) {
      setError("Couldn’t update comment like.");
      return { liked: false };
    }
    return res.json();
  }

  async function deleteComment(commentId: string) {
    setError("");
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Couldn’t delete comment.");
        return;
      }
      const listRes = await fetch(`/api/comments?targetType=post&targetId=${postId}`);
      if (listRes.ok) {
        const list = await listRes.json();
        setData((prev) => (prev ? { ...prev, commentList: list } : prev));
      }
    } catch {
      setError("Couldn’t delete comment.");
    }
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
          <PostMedia
            post={{
              image: data.image,
              images,
              caption: data.caption,
              mediaType: data.mediaType,
              videoUrl: data.videoUrl,
              videoDuration: data.videoDuration,
              videoPoster: data.videoPoster,
              videoChapters: data.videoChapters,
              postType: data.postType,
              beforeImage: data.beforeImage,
              afterImage: data.afterImage,
              audioUrl: data.audioUrl,
            }}
            variant="viewer"
            className="h-full"
          />
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
              currentUserId={user?.id}
              onReply={submitReply}
              onLike={likeComment}
              onDelete={deleteComment}
            />
          </div>

          <div className="border-t border-zinc-800 p-4">
            {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}
            <div className="mb-3 flex items-center gap-4 text-sm text-zinc-400">
              <button type="button" onClick={toggleLike} className={`flex items-center gap-1 ${liked ? "text-red-400" : ""}`}>
                <Flame className={`h-4 w-4 ${liked ? "fill-current text-amber-500" : ""}`} /> {likes}
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
