import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;
  const links = await prisma.creatorLink.findMany({
    where: { userId: session!.user.id },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!title || !url) return NextResponse.json({ error: "Title and URL required" }, { status: 400 });

  const count = await prisma.creatorLink.count({ where: { userId: session!.user.id } });
  const link = await prisma.creatorLink.create({
    data: { userId: session!.user.id, title, url, sortOrder: count },
  });
  return NextResponse.json({ link }, { status: 201 });
}
