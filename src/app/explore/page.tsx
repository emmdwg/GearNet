import { ExplorePageClient } from "@/components/feed/ExplorePageClient";
import { getFollowingIds, getLikedPostIds, getPitUpdates, getPosts, getSuggestedUsers } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Suspense } from "react";

export default async function ExplorePage() {
  const session = await getSession();
  const followingIds = session?.user?.id ? await getFollowingIds(session.user.id) : [];
  const [posts, pitUpdates, suggestions, likedPostIds] = await Promise.all([
    getPosts(),
    getPitUpdates(),
    getSuggestedUsers(session?.user?.id, followingIds, 5),
    session?.user?.id ? getLikedPostIds(session.user.id) : Promise.resolve([]),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading explore...</div>}>
      <ExplorePageClient
        posts={posts}
        pitUpdates={pitUpdates}
        followingIds={followingIds}
        suggestions={suggestions}
        likedPostIds={likedPostIds}
      />
    </Suspense>
  );
}
