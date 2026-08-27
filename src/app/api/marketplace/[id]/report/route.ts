import { requireAuth } from "@/lib/api-helpers";
import { reportUser } from "@/lib/blocking";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "other";
  await reportUser(session!.user.id, listing.sellerId, reason.slice(0, 40) || "other", body.details);
  return NextResponse.json({ ok: true });
}
