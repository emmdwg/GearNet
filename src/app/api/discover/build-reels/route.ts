import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  const posts = await prisma.post.findMany({
    where: {
      clubId: null,
      status: "published",
      mediaType: "video",
      videoUrl: { not: null },
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return NextResponse.json(
    posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      videoUrl: p.videoUrl,
      videoPoster: p.videoPoster,
      image: p.image,
      user: {
        username: p.user.username,
        displayName: p.user.displayName,
        avatar: p.user.avatar ?? "",
      },
    })),
  );
}
