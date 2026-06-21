import { getSession } from "@/lib/session";
import { searchListings, searchPosts, searchUsers, searchVehicles } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const session = await getSession();

  if (!q) {
    return NextResponse.json({ users: [], posts: [], vehicles: [], listings: [] });
  }

  const [users, posts, vehicles, listings] = await Promise.all([
    searchUsers(q, session?.user?.id),
    searchPosts(q),
    searchVehicles(q),
    searchListings(q),
  ]);

  return NextResponse.json({ users, posts, vehicles, listings });
}
