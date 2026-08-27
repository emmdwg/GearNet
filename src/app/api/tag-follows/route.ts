import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const follows = await prisma.tagFollow.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, tag: true, tagType: true },
  });
  return NextResponse.json(follows);
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const tag = typeof body.tag === "string" ? body.tag.trim().toLowerCase() : "";
  const tagType = typeof body.tagType === "string" ? body.tagType : "hashtag";
  if (!tag) return NextResponse.json({ error: "tag required" }, { status: 400 });

  const existing = await prisma.tagFollow.findUnique({
    where: { userId_tag_tagType: { userId: session!.user.id, tag, tagType } },
  });
  if (existing) {
    await prisma.tagFollow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }
  await prisma.tagFollow.create({
    data: { userId: session!.user.id, tag, tagType },
  });
  return NextResponse.json({ following: true });
}
