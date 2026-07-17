"use client";

import { BuildReelsViewer } from "@/components/feed/BuildReelsViewer";
import { BuildStyleGrid } from "@/components/feed/BuildStyleGrid";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { ScenePicker } from "@/components/onboarding/ScenePicker";
import { CreatePitUpdateModal } from "@/components/forms/CreatePitUpdateModal";
import { CreatePostModal } from "@/components/forms/CreatePostModal";
import { ActivityBell } from "@/components/activity/ActivityBell";
import { PitUpdateStrip } from "@/components/feed/PitUpdateStrip";
import { PitUpdateViewer } from "@/components/feed/PitUpdateViewer";
import { PostViewer } from "@/components/feed/PostViewer";
import { PostCard } from "@/components/feed/PostCard";
import { SuggestedBuilders, type SuggestedUser } from "@/components/feed/SuggestedBuilders";
import { Avatar } from "@/components/ui/Avatar";
import { NearYouPanel } from "@/components/feed/NearYouPanel";
import { BuildOfWeekStrip } from "@/components/feed/BuildOfWeekStrip";
import { BuildersLikeYouPanel } from "@/components/feed/BuildersLikeYouPanel";
import { InstallAppBanner } from "@/components/pwa/InstallAppPrompt";
import { PushPromptBanner } from "@/components/ui/PushPromptBanner";
import type { PitUpdate, Post } from "@/lib/types";
import { Plus, Search, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useScrollChrome } from "@/lib/scroll-chrome";
import { useScrollChromeListener } from "@/hooks/useScrollChromeListener";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  posts: Post[];
  pitUpdates: PitUpdate[];
  followingIds?: string[];
  suggestions?: SuggestedUser[];
  likedPostIds?: string[];
  bookmarkedPostIds?: string[];
};

export function ExploreContent({
  posts,
  pitUpdates,
  followingIds = [],
  suggestions = [],
  likedPostIds = [],
  bookmarkedPostIds = [],
}: Props) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const likedSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);
  const bookmarkedSet = useMemo(() => new Set(bookmarkedPostIds), [bookmarkedPostIds]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hidden: chromeHidden } = useScrollChrome();
  useScrollChromeListener(scrollRef);
  const [feedTab, setFeedTab] = useState<"forYou" | "following" | "nearYou">("forYou");
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [pitOpen, setPitOpen] = useState(false);
  const [pitViewerId, setPitViewerId] = useState<string | null>(null);
  const [postViewerId, setPostViewerId] = useState<string | null>(null);
  const [reelsOpen, setReelsOpen] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [mutedAuthorIds, setMutedAuthorIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!user) return;
    if (searchParams.get("createPost") === "1") setPostOpen(true);
    if (searchParams.get("createPit") === "1") setPitOpen(true);
  }, [searchParams, user]);

  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  useEffect(() => {
    const pit = searchParams.get("pit");
    if (pit && pit !== "1") setPitViewerId(pit);
    const post = searchParams.get("post");
    if (post) setPostViewerId(post);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = posts.filter(
      (p) => p.status !== "draft" && !hiddenIds.has(p.id) && !mutedAuthorIds.has(p.userId),
    );
    if (feedTab === "following") {
      result = result.filter((post) => followingSet.has(post.userId));
    }
    if (activeScene) {
      result = result.filter(
        (p) =>
          (p.user as { sceneTags?: string[] } | undefined)?.sceneTags?.includes(activeScene) ||
          p.tags.some((t) => t.toLowerCase() === activeScene),
      );
    }
    return result;
  }, [posts, feedTab, followingSet, hiddenIds, mutedAuthorIds, activeScene]);

  function afterCreate() {
    router.refresh();
  }

  if (authLoading) {
    return <p className="p-8 text-center text-zinc-500">Loading explore...</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
          <Zap className="h-6 w-6 text-zinc-950" />
        </div>
        <h1 className="text-xl font-bold text-white">Sign in to Explore</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Follow builders, see pits near you, and share your own builds with the scene.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/signin?callbackUrl=/explore"
            className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup?callbackUrl=/explore"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-amber-400 ring-1 ring-amber-500/30 transition hover:bg-amber-500/10"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const profileHref = `/profile/${user.username}`;

  return (
    <div className="mx-auto flex max-w-[470px] gap-8 xl:max-w-5xl xl:justify-center">
      <div
        ref={scrollRef}
        className={cn(
          "w-full overflow-y-auto transition-[height] duration-200 lg:h-[calc(100dvh-1rem)] xl:max-w-[470px]",
          chromeHidden ? "h-dvh lg:h-[calc(100dvh-1rem)]" : "h-[calc(100dvh-var(--mobile-nav-total))]",
        )}
      >
        <div
          className={cn(
            "sticky top-0 z-30 border-b border-border bg-background transition-transform duration-200 ease-out",
            chromeHidden && "max-lg:-translate-y-full max-lg:pointer-events-none",
          )}
        >
          <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                <Zap className="h-4 w-4 text-zinc-950" />
              </div>
              <p className="text-base font-bold tracking-tight text-white">GearNet</p>
            </div>
            <div className="flex items-center gap-0.5">
              <Link
                href="/search"
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-900 hover:text-white"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Link>
              <ActivityBell href="/activity" />
              <button
                type="button"
                onClick={() => setPostOpen(true)}
                className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-zinc-950 transition hover:bg-amber-400"
                aria-label="Create post"
              >
                <Plus className="h-4 w-4" />
              </button>
              <Link href={profileHref} aria-label="Profile" className="ml-0.5">
                <Avatar
                  src={
                    user.image ??
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop"
                  }
                  alt={user.name ?? "Profile"}
                  size="sm"
                />
              </Link>
            </div>
          </div>

          <div className="hidden items-center justify-between gap-3 px-4 pb-3 pt-4 lg:flex">
            <p className="text-sm font-semibold text-white">Explore</p>
            <button
              type="button"
              onClick={() => setPostOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-amber-500 px-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Post
            </button>
          </div>

          <div className="px-4 pb-3 pt-2 max-lg:pt-0">
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {(
                [
                  ["forYou", "For You"],
                  ["following", "Following"],
                  ["nearYou", "Near You"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFeedTab(id)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors sm:text-sm",
                    feedTab === id
                      ? "bg-amber-500 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 px-4 py-5">
          <div className="space-y-2">
            <InstallAppBanner />
            <PushPromptBanner />
            <OnboardingChecklist />
          </div>

          {feedTab === "forYou" ? (
            <div className="space-y-4">
              <PitUpdateStrip updates={pitUpdates} onAdd={() => setPitOpen(true)} onOpen={(id) => setPitViewerId(id)} />
              <ScenePicker />
              <BuildStyleGrid posts={posts} activeScene={activeScene} onSceneSelect={setActiveScene} />
              <button
                type="button"
                onClick={() => setReelsOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-amber-400 transition hover:border-amber-500/40"
              >
                Watch Build Reels
              </button>
              <BuildOfWeekStrip onOpen={setPostViewerId} />
            </div>
          ) : null}

          {activeScene ? (
            <button
              type="button"
              onClick={() => setActiveScene(null)}
              className="rounded-full bg-amber-500/15 px-3.5 py-1.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30"
            >
              {activeScene} ×
            </button>
          ) : null}

          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                {feedTab === "nearYou" ? "Near you" : feedTab === "following" ? "Following" : "Feed"}
              </h2>
              <p className="text-xs text-zinc-500">
                {feedTab === "nearYou"
                  ? "Geo-tagged builds around you"
                  : feedTab === "following"
                    ? "From builders you follow"
                    : "Fresh posts from the community"}
              </p>
            </div>
            {feedTab !== "nearYou" && filtered.length > 0 ? (
              <span className="text-[11px] tabular-nums text-zinc-600">{filtered.length}</span>
            ) : null}
          </div>

          {feedTab === "nearYou" ? (
            <NearYouPanel onOpenPost={setPostViewerId} />
          ) : feedTab === "following" && filtered.length === 0 ? (
            <div className="space-y-4">
              <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-5 py-8 text-center text-sm leading-relaxed text-zinc-500">
                Nothing here yet. Follow a few builders to fill this feed.
              </p>
              <SuggestedBuilders users={suggestions} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-5 py-10 text-center">
              <p className="text-sm leading-relaxed text-zinc-500">No posts yet. Be the first to share a build.</p>
              <button
                type="button"
                onClick={() => setPostOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                Share a post
              </button>
            </div>
          ) : (
            <div className="-mx-4 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
              {filtered.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpen={setPostViewerId}
                  initialLiked={likedSet.has(post.id)}
                  initialBookmarked={bookmarkedSet.has(post.id)}
                  onHidden={() => setHiddenIds((prev) => new Set(prev).add(post.id))}
                  onMuted={() => setMutedAuthorIds((prev) => new Set(prev).add(post.userId))}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="hidden w-72 shrink-0 py-6 xl:block">
        <div className="sticky top-6 space-y-5">
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Builders to follow</p>
            <SuggestedBuilders users={suggestions} />
          </div>
          <BuildersLikeYouPanel />
        </div>
      </aside>

      <CreatePostModal open={postOpen} onClose={() => setPostOpen(false)} onSuccess={afterCreate} />
      <CreatePitUpdateModal open={pitOpen} onClose={() => setPitOpen(false)} onSuccess={afterCreate} />
      {pitViewerId && <PitUpdateViewer updateId={pitViewerId} onClose={() => setPitViewerId(null)} />}
      {postViewerId && <PostViewer postId={postViewerId} onClose={() => setPostViewerId(null)} />}
      {reelsOpen ? <BuildReelsViewer onClose={() => setReelsOpen(false)} /> : null}
    </div>
  );
}
