import { requireAuth } from "@/lib/api-helpers";
import { getBookmarkedListings, getBookmarkedPosts } from "@/lib/db";
import { toggleBookmark, type BookmarkTargetType } from "@/lib/social";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const [posts, listings] = await Promise.all([
    getBookmarkedPosts(session!.user.id),
    getBookmarkedListings(session!.user.id),
  ]);

  return NextResponse.json({
    posts,
    listings,
    postIds: posts.map((p) => p.id),
    listingIds: listings.map((l) => l.id),
  });
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const targetType = body.targetType as BookmarkTargetType;
    const targetId = body.targetId as string;

    if (!targetType || !targetId || !["post", "listing"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    const result = await toggleBookmark(session!.user.id, targetType, targetId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}
