import { getListings } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { enforceRateLimit } from "@/lib/rate-limit";
import { imagesToJson, normalizeImages, primaryImage } from "@/lib/social";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const listings = await getListings();
  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "marketplace", 12, 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const images = normalizeImages(body);

    if (images.length === 0) {
      return NextResponse.json({ error: "At least one image required" }, { status: 400 });
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId: session!.user.id,
        title: body.title,
        description: body.description,
        price: body.price,
        category: body.category,
        condition: body.condition,
        image: primaryImage(images),
        images: imagesToJson(images),
        location: body.location,
        tradeAccepted: body.tradeAccepted ?? false,
      },
    });
    return NextResponse.json(listing, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
