import { requireAuth } from "@/lib/api-helpers";
import {
  addMemberToClub,
  clubNotFound,
  findClubBySlug,
  parseAssignableRole,
  removeMemberFromClub,
  requireClubManager,
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
  const { error: manageError } = await requireClubManager(club.id, session!.user.id);
  if (manageError) return manageError;

  const body = await request.json().catch(() => ({}));
  let user =
    typeof body.userId === "string"
      ? await prisma.user.findUnique({ where: { id: body.userId } })
      : null;
  if (!user && typeof body.username === "string") {
    user = await prisma.user.findFirst({
      where: { username: body.username.replace(/^@+/, "").trim().toLowerCase() },
    });
  }
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { member, alreadyMember } = await addMemberToClub(club.id, user.id, "member");
  return NextResponse.json({
    ok: true,
    userId: user.id,
    username: user.username,
    role: member.role,
    alreadyMember,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { error: manageError } = await requireClubManager(club.id, session!.user.id);
  if (manageError) return manageError;

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  const role = parseAssignableRole(body.role);
  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  }
  if (userId === club.ownerId) {
    return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 400 });
  }

  await prisma.clubMember.update({
    where: { clubId_userId: { clubId: club.id, userId } },
    data: { role },
  });
  return NextResponse.json({ ok: true, userId, role });
}

export async function DELETE(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { error: manageError } = await requireClubManager(club.id, session!.user.id);
  if (manageError) return manageError;

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const result = await removeMemberFromClub(club.id, userId);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, removed: userId });
}
