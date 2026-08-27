import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { image: true, caption: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.image.startsWith("http")) return NextResponse.redirect(post.image);
  return NextResponse.json(post);
}
