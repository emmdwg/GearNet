"use client";

import { formatRelativeDate } from "@/lib/utils";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type CommentItem = {
  id: string;
  userId?: string;
  parentId?: string | null;
  content: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatar: string };
  replies?: CommentItem[];
};

type Props = {
  comments: CommentItem[];
  currentUserId?: string | null;
  onReply: (parentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<{ liked: boolean }>;
  onDelete?: (commentId: string) => Promise<void>;
  onSignInRequired?: () => void;
};

export function CommentThread({ comments, currentUserId, onReply, onLike, onDelete, onSignInRequired }: Props) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReply() {
    if (!replyTo || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(replyTo, replyText.trim());
      setReplyText("");
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (comments.length === 0) {
    return <p className="text-sm text-zinc-600">No comments yet. Be the first to comment.</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((item) => (
        <CommentNode
          key={item.id}
          item={item}
          depth={0}
          replyTo={replyTo}
          replyText={replyText}
          submitting={submitting}
          onSetReplyTo={setReplyTo}
          onSetReplyText={setReplyText}
          onSubmitReply={submitReply}
          onLike={onLike}
          onDelete={onDelete}
          currentUserId={currentUserId}
          onSignInRequired={onSignInRequired}
        />
      ))}
    </div>
  );
}

function CommentNode({
  item,
  depth,
  replyTo,
  replyText,
  submitting,
  onSetReplyTo,
  onSetReplyText,
  onSubmitReply,
  onLike,
  onDelete,
  currentUserId,
  onSignInRequired,
}: {
  item: CommentItem;
  depth: number;
  replyTo: string | null;
  replyText: string;
  submitting: boolean;
  onSetReplyTo: (id: string | null) => void;
  onSetReplyText: (text: string) => void;
  onSubmitReply: () => void;
  onLike: (commentId: string) => Promise<{ liked: boolean }>;
  onDelete?: (commentId: string) => Promise<void>;
  currentUserId?: string | null;
  onSignInRequired?: () => void;
}) {
  const [likes, setLikes] = useState(item.likes);
  const [liked, setLiked] = useState(item.liked);
  const [deleting, setDeleting] = useState(false);
  const canDelete = Boolean(
    currentUserId && (item.userId === currentUserId || item.user.id === currentUserId) && onDelete
  );

  async function handleLike() {
    try {
      const result = await onLike(item.id);
      setLiked(result.liked);
      setLikes((n) => (result.liked ? n + 1 : Math.max(0, n - 1)));
    } catch {
      // ignore
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={depth > 0 ? "ml-6 border-l border-zinc-800 pl-3" : ""}>
      <div className="text-sm">
        <Link href={`/profile/${item.user.username}`} className="font-medium text-white hover:text-amber-400">
          {item.user.displayName}
        </Link>{" "}
        <span className="text-zinc-300">{item.content}</span>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-600">
          <span>{formatRelativeDate(item.createdAt)}</span>
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors hover:text-red-400 ${liked ? "text-red-400" : ""}`}
          >
            <Heart className={`h-3 w-3 ${liked ? "fill-current" : ""}`} />
            {likes > 0 ? likes : "Like"}
          </button>
          <button
            type="button"
            onClick={() => onSetReplyTo(replyTo === item.id ? null : item.id)}
            className="flex items-center gap-1 transition-colors hover:text-amber-400"
          >
            <MessageCircle className="h-3 w-3" />
            Reply
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 transition-colors hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              {deleting ? "..." : "Delete"}
            </button>
          ) : null}
        </div>
        {replyTo === item.id && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => onSetReplyText(e.target.value)}
              placeholder={`Reply to ${item.user.displayName}...`}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white"
              onKeyDown={(e) => e.key === "Enter" && !submitting && onSubmitReply()}
            />
            <button
              type="button"
              disabled={submitting}
              onClick={onSubmitReply}
              className="rounded-lg bg-amber-500 px-3 text-xs font-semibold text-zinc-950 disabled:opacity-50"
            >
              Post
            </button>
          </div>
        )}
      </div>
      {item.replies?.map((reply) => (
        <div key={reply.id} className="mt-3">
          <CommentNode
            item={reply}
            depth={depth + 1}
            replyTo={replyTo}
            replyText={replyText}
            submitting={submitting}
            onSetReplyTo={onSetReplyTo}
            onSetReplyText={onSetReplyText}
            onSubmitReply={onSubmitReply}
            onLike={onLike}
            onDelete={onDelete}
            currentUserId={currentUserId}
            onSignInRequired={onSignInRequired}
          />
        </div>
      ))}
    </div>
  );
}
