import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ userId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { userId } = await params;
  if (userId === session!.user.id) {
    return NextResponse.json({ error: "You cannot mute yourself" }, { status: 400 });
  }
  await prisma.mutedUser.upsert({
    where: { userId_mutedUserId: { userId: session!.user.id, mutedUserId: userId } },
    create: { userId: session!.user.id, mutedUserId: userId },
    update: {},
  });
  return NextResponse.json({ muted: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { userId } = await params;
  await prisma.mutedUser.deleteMany({
    where: { userId: session!.user.id, mutedUserId: userId },
  });
  return NextResponse.json({ muted: false });
}
