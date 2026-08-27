import { requireAuth } from "@/lib/api-helpers";
import { clubNotFound, findClubBySlug, requireClubManager, serializeChallenge } from "@/lib/clubs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string; challengeId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug, challengeId } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { error: manageError } = await requireClubManager(club.id, session!.user.id);
  if (manageError) return manageError;

  const challenge = await prisma.clubChallenge.findFirst({
    where: { id: challengeId, clubId: club.id },
  });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const updated = await prisma.clubChallenge.update({
    where: { id: challengeId },
    data: {
      status: typeof body.status === "string" ? body.status : challenge.status,
      winnerId: body.winnerId === undefined ? challenge.winnerId : body.winnerId || null,
    },
  });
  return NextResponse.json(await serializeChallenge(updated.id));
}
