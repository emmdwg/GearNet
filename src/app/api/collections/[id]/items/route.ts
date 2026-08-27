import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const collection = await prisma.postCollection.findFirst({
    where: { id, userId: session!.user.id },
  });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const postId = typeof body.postId === "string" ? body.postId : "";
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  await prisma.postCollectionItem.upsert({
    where: { collectionId_postId: { collectionId: id, postId } },
    create: { collectionId: id, postId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const collection = await prisma.postCollection.findFirst({
    where: { id, userId: session!.user.id },
  });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const postId = new URL(request.url).searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  await prisma.postCollectionItem.deleteMany({ where: { collectionId: id, postId } });
  return NextResponse.json({ ok: true });
}
