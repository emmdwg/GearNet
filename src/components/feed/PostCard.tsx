"use client";

import { formatRelativeDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { PostMedia } from "@/components/ui/PostMedia";
import { OwnerMenu } from "@/components/ui/OwnerMenu";
import { RichText } from "@/components/ui/RichText";
import { CreatePostModal } from "@/components/forms/CreatePostModal";
import { ReactionPicker } from "@/components/feed/ReactionPicker";
import { PostFeedMenu } from "@/components/feed/PostFeedMenu";
import { useAuth } from "@/lib/auth-context";
import type { ReactionType } from "@/lib/reactions";
import { MessageCircle, Send } from "lucide-react";
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
  mediaType?: string;
  videoUrl?: string;
  videoDuration?: number;
  videoPoster?: string;
  postType?: string;
  beforeImage?: string | null;
  afterImage?: string | null;
  inspiredByPostId?: string | null;
  collaborators?: string[];
  collaboratorUsers?: Array<{ username: string; displayName?: string; avatar?: string }>;
  audioUrl?: string | null;
  vehicleRef?: string;
  dynoHighlight?: string;
  isSponsored?: boolean;
  sponsorName?: string | null;
  sponsorUrl?: string | null;
  status?: string;
  scheduledAt?: string | null;
  reactionCounts?: Partial<Record<ReactionType, number>>;
  userReaction?: ReactionType | null;
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
  initialBookmarked = false,
  onHidden,
  onMuted,
}: {
  post: PostData;
  onOpen?: (postId: string) => void;
  initialLiked?: boolean;
  initialBookmarked?: boolean;
  onHidden?: () => void;
  onMuted?: () => void;
}) {
  const user = post.user;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [likes, setLikes] = useState(post.likes);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(post.userReaction ?? (initialLiked ? "like" : null));
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts ?? {});
  const [burst, setBurst] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const likeInFlight = useRef(false);
  const singleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const images = post.images && post.images.length > 0 ? post.images : [post.image];
  const collabNames = post.collaborators ?? [];
  const isCollab = post.postType === "collab" || collabNames.length > 0;
  const collabByUsername = new Map(
    (post.collaboratorUsers ?? []).map((u) => [u.username.replace(/^@/, "").toLowerCase(), u]),
  );
  const collabEntries = collabNames.map((name, i) => {
    const username = name.replace(/^@/, "");
    const resolved = collabByUsername.get(username.toLowerCase());
    const isUsername = /^[a-zA-Z0-9_]{2,30}$/.test(username);
    return {
      key: `${name}-${i}`,
      username,
      isUsername,
      displayName: resolved?.displayName,
      avatar: resolved?.avatar?.trim() || "",
      raw: name,
    };
  });

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    setActionError("");
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        return;
      }
      setActionError("Couldn’t delete post. Try again.");
    } catch {
      setActionError("Couldn’t delete post. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  const author: PostUser = user ?? {
    id: post.userId,
    username: "unknown",
    displayName: "Unknown builder",
    avatar: "",
  };

  function openPost(postId: string) {
    if (onOpen) {
      onOpen(postId);
      return;
    }
    router.push(`/explore?post=${encodeURIComponent(postId)}`);
  }

  async function handleReaction(type: ReactionType) {
    if (!currentUser) {
      router.push("/auth/signin?callbackUrl=/explore");
      return;
    }
    if (likeInFlight.current) return;
    likeInFlight.current = true;
    setActionError("");
    try {
      const res = await fetch("/api/likes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetId: post.id, reactionType: type }),
      });
      if (!res.ok) {
        setActionError("Couldn’t update reaction. Try again.");
        return;
      }
      const result = await res.json();
      const prev = userReaction;
      setUserReaction(result.reactionType);
      setReactionCounts((counts) => {
        const next = { ...counts };
        if (prev && next[prev]) next[prev] = Math.max(0, (next[prev] ?? 0) - 1);
        if (result.reactionType) {
          next[result.reactionType as ReactionType] = (next[result.reactionType as ReactionType] ?? 0) + 1;
        }
        return next;
      });
      setLikes((n) => {
        if (prev && !result.reactionType) return Math.max(0, n - 1);
        if (!prev && result.reactionType) return n + 1;
        return n;
      });
    } catch {
      setActionError("Couldn’t update reaction. Try again.");
    } finally {
      likeInFlight.current = false;
    }
  }

  function handleMediaOpen() {
    if (singleTimer.current) clearTimeout(singleTimer.current);
    singleTimer.current = setTimeout(() => openPost(post.id), 240);
  }

  function handleDoubleTap() {
    if (singleTimer.current) clearTimeout(singleTimer.current);
    if (!currentUser) {
      router.push("/auth/signin?callbackUrl=/explore");
      return;
    }
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    if (!userReaction) void handleReaction("like");
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = `${author.displayName} on GearNet: ${post.caption.slice(0, 80)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "GearNet", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Copied");
        setTimeout(() => setShareMsg(""), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareMsg("Copied");
        setTimeout(() => setShareMsg(""), 2000);
      } catch {
        window.prompt("Copy this link:", url);
      }
    }
  }

  return (
    <>
      <article className={`border-b border-zinc-800/80 bg-zinc-950 ${deleting ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar src={author.avatar} alt={author.displayName} href={`/profile/${author.username}`} size="sm" />
          <Link href={`/profile/${author.username}`} className="min-w-0 flex-1 text-sm font-semibold text-white hover:text-amber-400">
            {author.username}
          </Link>
          <OwnerMenu ownerId={post.userId} onEdit={() => setEditOpen(true)} onDelete={handleDelete} label="Post options" />
          {currentUser && currentUser.id !== post.userId ? (
            <PostFeedMenu
              postId={post.id}
              authorId={post.userId}
              authorUsername={author.username}
              postImageUrl={images[0]}
              postCaption={post.caption}
              authorDisplayName={author.displayName}
              onHidden={onHidden}
              onMuted={onMuted}
            />
          ) : null}
        </div>

        <div className="relative" onDoubleClick={handleDoubleTap}>
          <PostMedia post={post} onMediaClick={handleMediaOpen} />
          {burst && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="animate-like-burst text-6xl">🔥</span>
            </div>
          )}
          {post.dynoHighlight ? (
            <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-amber-300">
              {post.dynoHighlight}
            </div>
          ) : null}
        </div>

        <div className="px-3 pt-2.5">
          {actionError ? <p className="mb-2 text-xs text-red-400">{actionError}</p> : null}
          <div className="mb-2 flex items-start gap-4">
            <ReactionPicker
              userReaction={userReaction}
              reactionCounts={reactionCounts}
              onReact={handleReaction}
            />
            <button
              type="button"
              onClick={() => openPost(post.id)}
              className="text-white transition-colors hover:text-zinc-300"
              aria-label="Comments"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="text-white transition-colors hover:text-zinc-300"
              aria-label="Share"
            >
              <Send className="h-6 w-6" />
            </button>
            <BookmarkButton
              targetType="post"
              targetId={post.id}
              initialSaved={initialBookmarked}
              className="ml-auto text-white transition-colors hover:text-amber-400"
            />
          </div>

          {likes > 0 ? (
            <p className="mb-1.5 text-sm font-semibold text-white">
              {likes.toLocaleString()} {likes === 1 ? "flame" : "flames"}
            </p>
          ) : null}

          {post.vehicleRef ? (
            <p className="mb-1 text-xs text-amber-400/90">🚗 {post.vehicleRef}</p>
          ) : null}

          {post.inspiredByPostId ? (
            <p className="mb-1 text-xs text-zinc-500">
              Inspired by{" "}
              <button type="button" onClick={() => openPost(post.inspiredByPostId!)} className="text-amber-400 hover:underline">
                another build
              </button>
            </p>
          ) : null}

          {isCollab ? (
            <div className="mb-2 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">Build crew</Badge>
                {collabEntries.some((c) => c.avatar) ? (
                  <div className="flex items-center pl-1">
                    {collabEntries
                      .filter((c) => c.avatar && c.isUsername)
                      .slice(0, 5)
                      .map((c, i) => (
                        <Link
                          key={c.key}
                          href={`/profile/${c.username}`}
                          className="relative -ml-2 first:ml-0 rounded-full ring-2 ring-zinc-950"
                          style={{ zIndex: 10 - i }}
                          title={`@${c.username}`}
                        >
                          <Avatar src={c.avatar} alt={c.displayName || c.username} size="sm" />
                        </Link>
                      ))}
                  </div>
                ) : null}
                {collabEntries.filter((c) => !c.avatar).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {collabEntries
                      .filter((c) => !c.avatar)
                      .map((c) =>
                        c.isUsername ? (
                          <Link
                            key={c.key}
                            href={`/profile/${c.username}`}
                            className="text-xs text-amber-400 hover:underline"
                          >
                            @{c.username}
                          </Link>
                        ) : (
                          <span key={c.key} className="text-xs text-zinc-500">
                            {c.raw}
                          </span>
                        ),
                      )}
                  </div>
                ) : null}
              </div>
              {collabEntries.length > 0 ? (
                <p className="text-xs text-zinc-500">
                  With{" "}
                  {collabEntries.map((c, i) => (
                    <span key={c.key}>
                      {i > 0 ? ", " : ""}
                      {c.isUsername ? (
                        <Link href={`/profile/${c.username}`} className="text-amber-400 hover:underline">
                          @{c.username}
                        </Link>
                      ) : (
                        c.raw
                      )}
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          ) : null}

          {post.isSponsored ? (
            <p className="mb-1 text-xs font-medium text-amber-400/90">
              Paid partnership
              {post.sponsorName ? (
                <>
                  {" · "}
                  {post.sponsorUrl ? (
                    <a href={post.sponsorUrl} target="_blank" rel="noopener noreferrer sponsored" className="underline">
                      {post.sponsorName}
                    </a>
                  ) : (
                    post.sponsorName
                  )}
                </>
              ) : null}
            </p>
          ) : null}

          <p className="text-sm leading-snug text-white">
            <Link href={`/profile/${author.username}`} className="mr-1.5 font-semibold hover:text-amber-400">
              {author.username}
            </Link>
            <RichText text={post.caption} className="inline text-sm text-zinc-100" />
          </p>

          {post.postType === "before-after" ? (
            <div className="mt-1.5">
              <Badge variant="outline">Before/After</Badge>
            </div>
          ) : null}

          {post.tags.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
                  <Badge variant="accent">#{tag}</Badge>
                </Link>
              ))}
            </div>
          ) : null}

          {post.comments > 0 ? (
            <button
              type="button"
              onClick={() => openPost(post.id)}
              className="mt-1.5 text-sm text-zinc-500 hover:text-zinc-300"
            >
              View all {post.comments} comments
            </button>
          ) : null}

          <p className="mt-1 pb-3 text-[11px] uppercase tracking-wide text-zinc-500">
            {formatRelativeDate(post.createdAt)}
            {shareMsg ? ` · ${shareMsg}` : ""}
          </p>
        </div>
      </article>
      {currentUser?.id === post.userId && (
        <CreatePostModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          editing={{
            id: post.id,
            caption: post.caption,
            tags: post.tags,
            images,
            mediaType: post.mediaType,
            videoUrl: post.videoUrl,
            videoDuration: post.videoDuration,
            videoPoster: post.videoPoster,
            postType: post.postType as "standard" | "build" | "before-after" | "collab" | "audio" | undefined,
            vehicleId: undefined,
            beforeImage: post.beforeImage,
            afterImage: post.afterImage,
            inspiredByPostId: post.inspiredByPostId,
            collaborators: post.collaborators,
            audioUrl: post.audioUrl,
            scheduledAt: post.scheduledAt,
          }}
        />
      )}
    </>
  );
}
