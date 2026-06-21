import { getUserByUsername, getUserPosts, getUserVehicles } from "@/lib/db";
import { isBlocked } from "@/lib/blocking";
import { getSession } from "@/lib/session";
import { getFollowStats } from "@/lib/social";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const session = await getSession();

  if (session?.user?.id && (await isBlocked(session.user.id, user.id))) {
    return NextResponse.json({ error: "Profile unavailable" }, { status: 403 });
  }

  const [vehicles, posts, followStats] = await Promise.all([
    getUserVehicles(user.id),
    getUserPosts(user.id),
    getFollowStats(user.id, session?.user?.id),
  ]);

  return NextResponse.json({ user, vehicles, posts, followStats });
}
