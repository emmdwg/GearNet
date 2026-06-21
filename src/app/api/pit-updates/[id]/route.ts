import { getComments, getUserLikeState } from "@/lib/social";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  const update = await prisma.pitUpdate.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!update) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [comments, liked] = await Promise.all([
    getComments("pit_update", id, session?.user?.id),
    getUserLikeState(session?.user?.id, "pit_update", id),
  ]);

  return NextResponse.json({
    id: update.id,
    userId: update.userId,
    image: update.image,
    caption: update.caption,
    expiresAt: update.expiresAt.toISOString(),
    likes: update.likes,
    comments: update.commentCount,
    liked,
    user: {
      id: update.user.id,
      username: update.user.username,
      displayName: update.user.displayName,
      avatar: update.user.avatar ?? "",
    },
    commentList: comments,
  });
}
