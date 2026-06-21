"use client";

import { ExploreContent } from "@/components/feed/ExploreContent";
import type { SuggestedUser } from "@/components/feed/SuggestedBuilders";
import type { PitUpdate, Post } from "@/lib/types";

type Props = {
  posts: Post[];
  pitUpdates: PitUpdate[];
  followingIds: string[];
  suggestions: SuggestedUser[];
  likedPostIds?: string[];
};

export function ExplorePageClient({ posts, pitUpdates, followingIds, suggestions, likedPostIds }: Props) {
  return (
    <ExploreContent
      posts={posts}
      pitUpdates={pitUpdates}
      followingIds={followingIds}
      suggestions={suggestions}
      likedPostIds={likedPostIds}
    />
  );
}
