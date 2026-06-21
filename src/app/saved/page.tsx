import { ListingCard } from "@/components/marketplace/ListingCard";
import { PostCard } from "@/components/feed/PostCard";
import { getBookmarkedListings, getBookmarkedPosts } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Bookmark } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SavedPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/saved");

  const [posts, listings] = await Promise.all([
    getBookmarkedPosts(session.user.id),
    getBookmarkedListings(session.user.id),
  ]);

  const isEmpty = posts.length === 0 && listings.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Bookmark className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Saved</h1>
          <p className="text-sm text-zinc-500">Posts and listings you bookmarked</p>
        </div>
      </header>

      {isEmpty ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-500">
          Nothing saved yet. Tap the bookmark icon on a post or listing to keep it here.
        </p>
      ) : (
        <div className="space-y-10">
          {posts.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">Saved Posts</h2>
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {listings.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">Saved Listings</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
