import { requireAuth } from "@/lib/api-helpers";
import {
  allocateClubSlug,
  clubNotFound,
  findClubBySlug,
  requireClubManager,
  tagsToJson,
} from "@/lib/clubs";
import { getClubBySlug } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const session = await getSession();
  const club = await getClubBySlug(slug, session?.user?.id);
  if (!club) return clubNotFound();
  return NextResponse.json(club);
}

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const { error: manageError } = await requireClubManager(club.id, session!.user.id);
  if (manageError) return manageError;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
      if (body.name.trim() !== club.name) {
        data.slug = await allocateClubSlug(body.name.trim(), club.id);
      }
    }
    if (typeof body.description === "string") data.description = body.description.trim();
    if (typeof body.city === "string") data.city = body.city.trim() || null;
    if (body.image !== undefined) data.image = body.image || null;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
    if (body.tags !== undefined) data.tags = tagsToJson(body.tags);
    if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
    if (typeof body.requiresApproval === "boolean") data.requiresApproval = body.requiresApproval;
    if (body.merchUrl !== undefined) {
      data.merchUrl = typeof body.merchUrl === "string" ? body.merchUrl.trim() || null : null;
    }

    const updated = await prisma.club.update({
      where: { id: club.id },
      data,
      include: { owner: true },
    });
    const fresh = await getClubBySlug(updated.slug, session!.user.id);
    return NextResponse.json(fresh ?? updated);
  } catch (err) {
    console.error("PATCH /api/clubs/[slug] failed:", err);
    return NextResponse.json({ error: "Failed to update club" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  if (club.ownerId !== session!.user.id) {
    return NextResponse.json({ error: "Only the owner can delete this club" }, { status: 403 });
  }

  await prisma.club.delete({ where: { id: club.id } });
  return NextResponse.json({ deleted: true });
}
