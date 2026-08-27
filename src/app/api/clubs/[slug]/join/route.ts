import { requireAuth } from "@/lib/api-helpers";
import {
  addMemberToClub,
  clubNotFound,
  findClubBySlug,
  notifyClubOwner,
  removeMemberFromClub,
} from "@/lib/clubs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const existing = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId: club.id, userId: session!.user.id } },
  });
  if (existing || club.ownerId === session!.user.id) {
    return NextResponse.json({ joined: true, role: existing?.role ?? "owner" });
  }

  let message = "";
  try {
    const body = await request.json();
    if (typeof body?.message === "string") message = body.message.trim().slice(0, 500);
  } catch {
    message = "";
  }

  const needsRequest = Boolean(club.requiresApproval) || !club.isPublic;
  if (needsRequest) {
    await prisma.clubJoinRequest.upsert({
      where: { clubId_userId: { clubId: club.id, userId: session!.user.id } },
      create: { clubId: club.id, userId: session!.user.id, message: message || null },
      update: { message: message || null, status: "pending", reviewedAt: null },
    });
    await notifyClubOwner(
      club,
      session!.user.id,
      "Club join request",
      `${session!.user.name} requested to join ${club.name}`,
    );
    return NextResponse.json({ requested: true, joinRequestPending: true });
  }

  const { member } = await addMemberToClub(club.id, session!.user.id);
  return NextResponse.json({ joined: true, role: member.role });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const pending = await prisma.clubJoinRequest.findUnique({
    where: { clubId_userId: { clubId: club.id, userId: session!.user.id } },
  });
  if (pending?.status === "pending") {
    await prisma.clubJoinRequest.delete({ where: { id: pending.id } });
    return NextResponse.json({ cancelled: true });
  }

  const result = await removeMemberFromClub(club.id, session!.user.id);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ left: true });
}
