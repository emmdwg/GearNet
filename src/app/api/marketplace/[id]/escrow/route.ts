import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function serializeTx(tx: {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  amount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...tx,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tx = await prisma.listingTransaction.findFirst({
    where: {
      listingId: id,
      OR: [{ buyerId: session!.user.id }, { sellerId: session!.user.id }],
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tx ? serializeTx(tx) : null);
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId === session!.user.id) {
    return NextResponse.json({ error: "Sellers cannot request escrow on their own listing" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const existing = await prisma.listingTransaction.findFirst({
    where: { listingId: id, buyerId: session!.user.id, status: { in: ["requested", "accepted"] } },
  });
  if (existing) return NextResponse.json(serializeTx(existing));

  const tx = await prisma.listingTransaction.create({
    data: {
      listingId: id,
      buyerId: session!.user.id,
      sellerId: listing.sellerId,
      amount: listing.price,
      notes: typeof body.notes === "string" ? body.notes.trim() : null,
    },
  });
  return NextResponse.json(serializeTx(tx), { status: 201 });
}
