import { requireAuth } from "@/lib/api-helpers";
import { blockUser, unblockUser } from "@/lib/blocking";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "User required" }, { status: 400 });
    await blockUser(session!.user.id, userId);
    return NextResponse.json({ ok: true, blocked: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not block user" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "User required" }, { status: 400 });

  await unblockUser(session!.user.id, userId);
  return NextResponse.json({ ok: true, blocked: false });
}

export async function GET(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "User required" }, { status: 400 });

  const block = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: session!.user.id, blockedId: userId } },
  });

  return NextResponse.json({ blocked: Boolean(block) });
}
