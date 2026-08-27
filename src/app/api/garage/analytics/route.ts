import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { isProActive } from "@/lib/platform";
import { sumInstalledModCosts } from "@/lib/vehicle-meta";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: {
      vehicles: { include: { mods: true } },
      posts: { select: { id: true, likes: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isProActive(user)) {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const [profileViews, postSaves] = await Promise.all([
    prisma.profileView.count({ where: { profileId: user.id } }),
    prisma.bookmark.count({
      where: { targetType: "post", targetId: { in: user.posts.map((p) => p.id) } },
    }),
  ]);

  return NextResponse.json({
    profileViews,
    vehicleCount: user.vehicles.length,
    modSpendTotal: user.vehicles.reduce((sum, v) => sum + sumInstalledModCosts(v.mods), 0),
    postSaves,
    listingClicks: 0,
    totalReactions: user.posts.reduce((sum, p) => sum + p.likes, 0),
    reactions: { like: user.posts.reduce((sum, p) => sum + p.likes, 0) },
  });
}
