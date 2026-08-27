import { requireAuth } from "@/lib/api-helpers";
import { reportUser } from "@/lib/blocking";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { userId: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "other";
  await reportUser(session!.user.id, post.userId, reason, body.details);
  return NextResponse.json({ ok: true });
}
