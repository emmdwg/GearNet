import { getFollowingIds, getSuggestedUsers } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  const viewerId = session?.user?.id;

  const followingIds = viewerId ? await getFollowingIds(viewerId) : [];
  const users = await getSuggestedUsers(viewerId, followingIds, 8);

  return NextResponse.json({ users });
}
