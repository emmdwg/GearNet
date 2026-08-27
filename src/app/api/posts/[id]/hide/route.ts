import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.hiddenPost.upsert({
    where: { userId_postId: { userId: session!.user.id, postId: id } },
    create: { userId: session!.user.id, postId: id },
    update: {},
  });
  return NextResponse.json({ hidden: true });
}
