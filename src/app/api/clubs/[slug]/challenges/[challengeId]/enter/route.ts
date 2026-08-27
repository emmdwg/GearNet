import { requireAuth } from "@/lib/api-helpers";
import { clubNotFound, findClubBySlug, requireClubMember } from "@/lib/clubs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string; challengeId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug, challengeId } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { error: memberError } = await requireClubMember(club.id, session!.user.id);
  if (memberError) return memberError;

  const challenge = await prisma.clubChallenge.findFirst({
    where: { id: challengeId, clubId: club.id },
  });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const entry = await prisma.clubChallengeEntry.upsert({
    where: { challengeId_userId: { challengeId, userId: session!.user.id } },
    create: {
      challengeId,
      userId: session!.user.id,
      postId: typeof body.postId === "string" ? body.postId : null,
    },
    update: { postId: typeof body.postId === "string" ? body.postId : undefined },
  });
  return NextResponse.json({ id: entry.id });
}
