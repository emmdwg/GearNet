import { requireAuth } from "@/lib/api-helpers";
import { getLikedPostIds } from "@/lib/db";
import { getSession } from "@/lib/session";
import { toggleLike, type LikeTargetType } from "@/lib/social";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ postIds: [] });
  const postIds = await getLikedPostIds(session.user.id);
  return NextResponse.json({ postIds });
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const targetType = body.targetType as LikeTargetType;
    const targetId = body.targetId as string;

    if (!targetType || !targetId || !["post", "pit_update", "comment"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    const result = await toggleLike(session!.user.id, targetType, targetId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
