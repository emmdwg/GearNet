import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const shopName = typeof body.shopName === "string" ? body.shopName.trim() : "";
  const rating = Number(body.rating);
  if (!shopName || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "shopName and rating 1–5 required" }, { status: 400 });
  }

  const row = await prisma.shopRating.upsert({
    where: { userId_shopName: { userId: session!.user.id, shopName } },
    create: {
      userId: session!.user.id,
      shopName,
      rating: Math.round(rating),
      review: typeof body.review === "string" ? body.review.trim() || null : null,
    },
    update: {
      rating: Math.round(rating),
      review: typeof body.review === "string" ? body.review.trim() || null : undefined,
    },
  });
  return NextResponse.json({ id: row.id });
}
