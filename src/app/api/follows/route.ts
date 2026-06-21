import { isBlocked } from "@/lib/blocking";
import { requireAuth } from "@/lib/api-helpers";
import { getFollowStats, toggleFollow } from "@/lib/social";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const targetUserId = body.userId as string;

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (targetUserId === session!.user.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }
    if (await isBlocked(session!.user.id, targetUserId)) {
      return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
    }

    const result = await toggleFollow(session!.user.id, targetUserId);
    const stats = await getFollowStats(targetUserId, session!.user.id);
    return NextResponse.json({ ...result, ...stats });
  } catch {
    return NextResponse.json({ error: "Failed to update follow" }, { status: 500 });
  }
}
