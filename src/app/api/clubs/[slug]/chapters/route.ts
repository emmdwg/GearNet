import { jsonArray, requireAuth } from "@/lib/api-helpers";
import { allocateClubSlug, clubNotFound, findClubBySlug, requireClubManager } from "@/lib/clubs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const chapters = await prisma.club.findMany({
    where: { parentClubId: club.id, isPublic: true },
    select: { id: true, slug: true, name: true, city: true, memberCount: true, image: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(chapters);
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
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const chapterSlug = await allocateClubSlug(name);
  const chapter = await prisma.$transaction(async (tx) => {
    const created = await tx.club.create({
      data: {
        slug: chapterSlug,
        name,
        description:
          typeof body.description === "string" && body.description.trim()
            ? body.description.trim()
            : `${name} chapter of ${club.name}`,
        city: typeof body.city === "string" ? body.city.trim() || null : null,
        tags: jsonArray([]),
        ownerId: session!.user.id,
        memberCount: 1,
        isPublic: club.isPublic,
        requiresApproval: club.requiresApproval,
        parentClubId: club.id,
      },
    });
    await tx.clubMember.create({
      data: { clubId: created.id, userId: session!.user.id, role: "owner" },
    });
    return created;
  });

  return NextResponse.json({ slug: chapter.slug }, { status: 201 });
}
