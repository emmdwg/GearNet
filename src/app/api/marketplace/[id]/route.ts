import { requireAuth } from "@/lib/api-helpers";
import { getBookmarkState, imagesToJson, normalizeImages, primaryImage } from "@/lib/social";
import { getListingById } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();
    const listing = await getListingById(id);
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const bookmarked = await getBookmarkState(session?.user?.id, "listing", id);
    return NextResponse.json({ ...listing, bookmarked });
  } catch (err) {
    console.error("GET /api/marketplace/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load listing" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.marketplaceListing.findUnique({ where: { id }, select: { sellerId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.sellerId !== session!.user.id) {
      return NextResponse.json({ error: "You can only edit your own listings" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.description === "string") data.description = body.description.trim();
    if (body.price !== undefined && !Number.isNaN(Number(body.price))) data.price = Math.max(0, parseInt(body.price, 10));
    if (typeof body.category === "string") data.category = body.category;
    if (typeof body.condition === "string") data.condition = body.condition;
    if (typeof body.location === "string") data.location = body.location.trim();
    if (typeof body.tradeAccepted === "boolean") data.tradeAccepted = body.tradeAccepted;
    if (Array.isArray(body.images) && body.images.length > 0) {
      const images = normalizeImages(body);
      data.images = imagesToJson(images);
      data.image = primaryImage(images);
    }

    const listing = await prisma.marketplaceListing.update({ where: { id }, data });
    return NextResponse.json(listing);
  } catch (err) {
    console.error("PATCH /api/marketplace/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.marketplaceListing.findUnique({ where: { id }, select: { sellerId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.sellerId !== session!.user.id) {
      return NextResponse.json({ error: "You can only delete your own listings" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.bookmark.deleteMany({ where: { targetType: "listing", targetId: id } }),
      prisma.marketplaceListing.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/marketplace/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
