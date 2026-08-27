import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const existing = await prisma.creatorLink.findFirst({
    where: { id, userId: session!.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data: { title?: string; url?: string; sortOrder?: number } = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.url === "string") data.url = body.url.trim();
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  const link = await prisma.creatorLink.update({ where: { id }, data });
  return NextResponse.json({ link });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  await prisma.creatorLink.deleteMany({ where: { id, userId: session!.user.id } });
  return NextResponse.json({ ok: true });
}
