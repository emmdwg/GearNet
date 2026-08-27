import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get("city")?.trim();
  if (!city) return NextResponse.json({ hero: null });

  const users = await prisma.user.findMany({
    where: { location: { contains: city, mode: "insensitive" } },
    select: {
      username: true,
      displayName: true,
      location: true,
      _count: { select: { posts: true } },
    },
    orderBy: { posts: { _count: "desc" } },
    take: 1,
  });
  const hero = users[0];
  return NextResponse.json({
    hero: hero
      ? {
          username: hero.username,
          displayName: hero.displayName,
          city: hero.location ?? city,
          postCount: hero._count.posts,
        }
      : null,
  });
}
