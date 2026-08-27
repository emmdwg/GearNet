import { requireAuth } from "@/lib/api-helpers";
import {
  clubNotFound,
  findClubBySlug,
  requireClubManager,
  requireClubMember,
  serializeDues,
} from "@/lib/clubs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { membership, error: memberError } = await requireClubMember(club.id, session!.user.id);
  if (memberError) return memberError;

  const rows = await prisma.clubDuesEntry.findMany({
    where: { clubId: club.id },
    include: { user: true, recordedBy: true },
    orderBy: { createdAt: "desc" },
  });
  const canSeeAll = membership.isOwner || membership.role === "admin";
  const visible = canSeeAll ? rows : rows.filter((row) => row.userId === session!.user.id);
  return NextResponse.json(visible.map(serializeDues));
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { error: manageError } = await requireClubManager(club.id, session!.user.id);
  if (manageError) return manageError;

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  const amount = Number(body.amount);
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : "Dues";
  if (!userId || !Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "userId and amount required" }, { status: 400 });
  }

  const created = await prisma.clubDuesEntry.create({
    data: {
      clubId: club.id,
      userId,
      amount,
      label,
      recordedById: session!.user.id,
    },
    include: { user: true, recordedBy: true },
  });
  return NextResponse.json(serializeDues(created), { status: 201 });
}
