"use client";

import { formatRelativeDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { OwnerMenu } from "@/components/ui/OwnerMenu";
import { RichText } from "@/components/ui/RichText";
import { CreatePostModal } from "@/components/forms/CreatePostModal";
import { useAuth } from "@/lib/auth-context";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type PostUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
};

type PostData = {
  id: string;
  userId: string;
  image: string;
  images?: string[];
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  user?: PostUser;
};

export function PostCard({
  post,
  onOpen,
  initialLiked = false,
}: {
  post: PostData;
  onOpen?: (postId: string) => void;
  initialLiked?: boolean;
}) {
  const user = post.user;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(initialLiked);
  const [burst, setBurst] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const likeInFlight = useRef(false);
  const singleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const images = post.images && post.images.length > 0 ? post.images : [post.image];

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (!user) return null;

  async function toggleLikeRequest() {
    if (likeInFlight.current) return;
    likeInFlight.current = true;
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetId: post.id }),
      });
      if (!res.ok) return;
      const result = await res.json();
      setLiked(result.liked);
      setLikes((n) => (result.liked ? n + 1 : Math.max(0, n - 1)));
    } finally {
      likeInFlight.current = false;
    }
  }

  function handleLike() {
    if (!currentUser) {
      router.push("/auth/signin?callbackUrl=/explore");
      return;
    }
    void toggleLikeRequest();
  }

  function handleImageOpen() {
    if (singleTimer.current) clearTimeout(singleTimer.current);
    singleTimer.current = setTimeout(() => onOpen?.(post.id), 240);
  }

  function handleDoubleTap() {
    if (singleTimer.current) clearTimeout(singleTimer.current);
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    if (!currentUser) return;
    if (!liked) void toggleLikeRequest();
  }

  async function handleShare() {
    const url = `${window.location.origin}/profile/${user!.username}`;
    const text = `${user!.displayName} on GearNet: ${post.caption.slice(0, 80)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "GearNet", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied!");
        setTimeout(() => setShareMsg(""), 2000);
      }
    } catch {
      // cancelled
    }
  }

  return (
    <>
    <article className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 ${deleting ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar src={user.avatar} alt={user.displayName} href={`/profile/${user.username}`} />
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${user.username}`} className="font-semibold text-white hover:text-amber-400">
            {user.displayName}
          </Link>
          <p className="text-xs text-zinc-500">
            @{user.username} · {formatRelativeDate(post.createdAt)}
          </p>
        </div>
        <OwnerMenu ownerId={post.userId} onEdit={() => setEditOpen(true)} onDelete={handleDelete} label="Post options" />
      </div>

      <div className="relative" onDoubleClick={handleDoubleTap}>
        <ImageCarousel images={images} alt={post.caption} onImageClick={handleImageOpen} />
        {burst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-24 w-24 fill-white text-white drop-shadow-lg animate-like-burst" />
          </div>
        )}
      </div>

      <div className="space-y-3 px-4 py-4">
        <RichText text={post.caption} className="text-sm leading-relaxed text-zinc-300" />
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
              <Badge variant="accent">#{tag}</Badge>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-6 border-t border-zinc-800 pt-3 text-sm text-zinc-500">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${liked ? "text-red-400" : "hover:text-red-400"}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {likes}
          </button>
          <button
            type="button"
            onClick={() => onOpen?.(post.id)}
            className="flex items-center gap-1.5 transition-colors hover:text-amber-400"
          >
            <MessageSquare className="h-4 w-4" />
            {post.comments}
          </button>
          <button type="button" onClick={handleShare} className="flex items-center gap-1.5 transition-colors hover:text-white">
            <Share2 className="h-4 w-4" />
            {shareMsg || "Share"}
          </button>
          <BookmarkButton targetType="post" targetId={post.id} className="ml-auto flex items-center gap-1.5 transition-colors hover:text-amber-400" />
        </div>
      </div>
    </article>
    {currentUser?.id === post.userId && (
      <CreatePostModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={{ id: post.id, caption: post.caption, tags: post.tags, images }}
      />
    )}
    </>
  );
}
