import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const shopName = new URL(request.url).searchParams.get("shopName")?.trim();
  if (!shopName) return NextResponse.json({ error: "shopName required" }, { status: 400 });

  const session = await getSession();
  const ratings = await prisma.shopRating.findMany({ where: { shopName } });
  const ratingCount = ratings.length;
  const averageRating =
    ratingCount > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount : null;
  const mine = session?.user?.id
    ? ratings.find((r) => r.userId === session.user.id)
    : undefined;

  return NextResponse.json({
    shopName,
    averageRating,
    ratingCount,
    userRating: mine ? { rating: mine.rating, review: mine.review } : null,
  });
}
