import { requireAuth } from "@/lib/api-helpers";
import {
  clubNotFound,
  findClubBySlug,
  requireClubManager,
  requireClubMember,
  serializeChallenge,
} from "@/lib/clubs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const rows = await prisma.clubChallenge.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "desc" },
  });
  const challenges = (await Promise.all(rows.map((row) => serializeChallenge(row.id)))).filter(
    Boolean,
  );
  return NextResponse.json(challenges);
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const body = await request.json().catch(() => ({}));

  if (body.enter === true || typeof body.challengeId === "string") {
    const { error: memberError } = await requireClubMember(club.id, session!.user.id);
    if (memberError) return memberError;
    const challengeId = String(body.challengeId ?? "");
    if (!challengeId) return NextResponse.json({ error: "challengeId required" }, { status: 400 });
    const challenge = await prisma.clubChallenge.findFirst({
      where: { id: challengeId, clubId: club.id },
    });
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
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

  const { error: manageError } = await requireClubManager(club.id, session!.user.id);
  if (manageError) return manageError;

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const now = new Date();
  const ends = new Date(now);
  ends.setDate(ends.getDate() + 30);
  const created = await prisma.clubChallenge.create({
    data: {
      clubId: club.id,
      title,
      description: typeof body.description === "string" ? body.description.trim() : "",
      type: typeof body.type === "string" ? body.type : "photo-battle",
      startsAt: body.startsAt ? new Date(body.startsAt) : now,
      endsAt: body.endsAt ? new Date(body.endsAt) : ends,
    },
  });
  return NextResponse.json(await serializeChallenge(created.id), { status: 201 });
}
