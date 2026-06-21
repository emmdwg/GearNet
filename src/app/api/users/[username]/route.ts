import { getUserByUsername, getUserPosts, getUserVehicles } from "@/lib/db";
import { isBlocked } from "@/lib/blocking";
import { filterUserForViewer, getProfileViewContext } from "@/lib/privacy";
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

  const view = await getProfileViewContext(user.id, session?.user?.id);
  const filteredUser = filterUserForViewer(user, view);

  const [vehicles, posts, followStats] = await Promise.all([
    view.canViewGarage ? getUserVehicles(user.id) : Promise.resolve([]),
    view.canViewPosts ? getUserPosts(user.id) : Promise.resolve([]),
    getFollowStats(user.id, session?.user?.id),
  ]);

  return NextResponse.json({
    user: filteredUser,
    vehicles,
    posts,
    followStats,
    view: {
      access: view.access,
      canViewPosts: view.canViewPosts,
      canViewGarage: view.canViewGarage,
      canViewLocation: view.canViewLocation,
      canMessage: view.canMessage,
      isFollowing: view.isFollowing,
      isPrivate: view.isPrivate,
    },
  });
}
