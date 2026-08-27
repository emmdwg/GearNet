import { getListingById, getListings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const listing = await getListingById(id);
  if (!listing) return NextResponse.json({ listings: [] });

  const all = await getListings(session?.user?.id);
  const listings = all
    .filter((item) => item.id !== id && item.category === listing.category && !item.soldAt)
    .slice(0, 6);
  return NextResponse.json({ listings });
}
