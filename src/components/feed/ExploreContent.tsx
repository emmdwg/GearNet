"use client";

import { CreatePitUpdateModal } from "@/components/forms/CreatePitUpdateModal";
import { CreatePostModal } from "@/components/forms/CreatePostModal";
import { ActivityBell } from "@/components/activity/ActivityBell";
import { PitUpdateStrip } from "@/components/feed/PitUpdateStrip";
import { PitUpdateViewer } from "@/components/feed/PitUpdateViewer";
import { PostViewer } from "@/components/feed/PostViewer";
import { PostCard } from "@/components/feed/PostCard";
import { SuggestedBuilders, type SuggestedUser } from "@/components/feed/SuggestedBuilders";
import { Avatar } from "@/components/ui/Avatar";
import { TrendingTags } from "@/components/tags/TrendingTags";
import type { PitUpdate, Post } from "@/lib/types";
import { Bookmark, Plus, Search, Settings, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  posts: Post[];
  pitUpdates: PitUpdate[];
  followingIds?: string[];
  suggestions?: SuggestedUser[];
  likedPostIds?: string[];
};

export function ExploreContent({ posts, pitUpdates, followingIds = [], suggestions = [], likedPostIds = [] }: Props) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const likedSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [feedTab, setFeedTab] = useState<"forYou" | "following">("forYou");
  const [postOpen, setPostOpen] = useState(false);
  const [pitOpen, setPitOpen] = useState(false);
  const [pitViewerId, setPitViewerId] = useState<string | null>(null);
  const [postViewerId, setPostViewerId] = useState<string | null>(null);

  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  useEffect(() => {
    const pit = searchParams.get("pit");
    if (pit) setPitViewerId(pit);
    const post = searchParams.get("post");
    if (post) setPostViewerId(post);
  }, [searchParams]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setCollapsed(el.scrollTop > 48);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = useMemo(() => {
    let result = posts;
    if (feedTab === "following") {
      result = result.filter((post) => followingSet.has(post.userId));
    }
    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
      (post) =>
        post.caption.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        post.user?.username.toLowerCase().includes(q) ||
        post.user?.displayName.toLowerCase().includes(q)
    );
  }, [posts, search, feedTab, followingSet]);

  function handleNewPost() {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/explore";
      return;
    }
    setPostOpen(true);
  }

  function handleAddPitUpdate() {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/explore";
      return;
    }
    setPitOpen(true);
  }

  const profileHref = user?.username ? `/profile/${user.username}` : "/auth/signin";

  return (
    <div className="mx-auto flex max-w-2xl gap-6 xl:max-w-5xl xl:justify-center">
      <div
        ref={scrollRef}
        className="h-[calc(100vh-5rem)] w-full overflow-y-auto lg:h-[calc(100vh-1rem)] xl:max-w-2xl"
      >
      <div className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="flex items-center justify-between px-4 pb-3 pt-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500">
              <Zap className="h-5 w-5 text-zinc-950" />
            </div>
            <div>
              <p className="text-base font-bold text-white">GearNet</p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Drive. Build. Connect.</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/search" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
            <ActivityBell />
            <Link href="/saved" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white" aria-label="Saved">
              <Bookmark className="h-5 w-5" />
            </Link>
            <Link href="/settings" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white">
              <Settings className="h-5 w-5" />
            </Link>
            <Link href={profileHref}>
              <Avatar
                src={user?.image ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop"}
                alt={user?.name ?? "Profile"}
                size="sm"
              />
            </Link>
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ${collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-2">
              <h1 className="text-xl font-bold text-white">Explore Feed</h1>
              <p className="text-sm leading-snug text-zinc-500">Community builds, tech updates & car photography</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search builds, tags, users..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleNewPost}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400"
            aria-label="Create post"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6">
        <PitUpdateStrip updates={pitUpdates} onAdd={handleAddPitUpdate} onOpen={(id) => setPitViewerId(id)} />

        <TrendingTags compact />

        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
          <button
            type="button"
            onClick={() => setFeedTab("forYou")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              feedTab === "forYou" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            For You
          </button>
          <button
            type="button"
            onClick={() => setFeedTab("following")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              feedTab === "following" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            Following
          </button>
        </div>

        {feedTab === "following" && filtered.length === 0 ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
              {user
                ? "No posts from people you follow yet. Follow some builders below to fill this feed."
                : "Sign in and follow builders to see their posts here."}
            </p>
            <SuggestedBuilders users={suggestions} />
          </div>
        ) : (
          filtered.map((post) => (
            <PostCard key={post.id} post={post} onOpen={setPostViewerId} initialLiked={likedSet.has(post.id)} />
          ))
        )}
      </div>
      </div>

      <aside className="hidden w-72 shrink-0 py-6 xl:block">
        <div className="sticky top-6">
          <SuggestedBuilders users={suggestions} />
        </div>
      </aside>

      <CreatePostModal open={postOpen} onClose={() => setPostOpen(false)} />
      <CreatePitUpdateModal open={pitOpen} onClose={() => setPitOpen(false)} />
      {pitViewerId && <PitUpdateViewer updateId={pitViewerId} onClose={() => setPitViewerId(null)} />}
      {postViewerId && <PostViewer postId={postViewerId} onClose={() => setPostViewerId(null)} />}
    </div>
  );
}
