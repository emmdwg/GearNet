import { requireAuth } from "@/lib/api-helpers";
import { clubNotFound, findClubBySlug, requireClubManager, serializeProject } from "@/lib/clubs";
import { jsonArray } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const rows = await prisma.clubProject.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "desc" },
  });
  const projects = (await Promise.all(rows.map((row) => serializeProject(row.id)))).filter(Boolean);
  return NextResponse.json(projects);
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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const created = await prisma.clubProject.create({
    data: {
      clubId: club.id,
      title,
      description: typeof body.description === "string" ? body.description.trim() : "",
      vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : null,
      contributorIds: jsonArray([session!.user.id]),
    },
  });
  return NextResponse.json(await serializeProject(created.id), { status: 201 });
}
