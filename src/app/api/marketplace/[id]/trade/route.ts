import { requireAuth } from "@/lib/api-helpers";
import { formatTradeOfferMessage, openMarketplaceChat } from "@/lib/marketplace-chat";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/social";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId === session!.user.id) {
    return NextResponse.json({ error: "You cannot offer on your own listing" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const offer = await prisma.tradeOffer.create({
    data: {
      listingId: id,
      fromUserId: session!.user.id,
      toUserId: listing.sellerId,
      message: typeof body.message === "string" ? body.message.trim() : null,
    },
  });

  const text = formatTradeOfferMessage({
    offerId: offer.id,
    listingTitle: listing.title,
    listingPrice: listing.price,
    note: offer.message,
  });
  await openMarketplaceChat(session!.user.id, listing.sellerId, text);
  try {
    await createNotification({
      userId: listing.sellerId,
      actorId: session!.user.id,
      type: "trade_offer",
      targetType: "listing",
      targetId: listing.id,
      title: "Trade offer",
      body: `${session!.user.name} sent an offer on ${listing.title}`,
    });
  } catch {
    // ignore
  }

  return NextResponse.json(offer, { status: 201 });
}
