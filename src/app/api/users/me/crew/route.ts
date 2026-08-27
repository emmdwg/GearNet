import { requireAuth } from "@/lib/api-helpers";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function listCrew(userId: string) {
  const rows = await prisma.crewMember.findMany({
    where: { userId },
    include: { crewUser: true },
    orderBy: { createdAt: "desc" },
  });
  const members = rows.map((row) => ({
    userId: row.crewUserId,
    username: row.crewUser.username,
    displayName: row.crewUser.displayName,
    avatar: row.crewUser.avatar ?? DEFAULT_AVATAR,
  }));
  return { members, count: members.length };
}

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;
  return NextResponse.json(await listCrew(session!.user.id));
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  let target =
    typeof body.userId === "string"
      ? await prisma.user.findUnique({ where: { id: body.userId } })
      : null;
  if (!target && typeof body.username === "string") {
    target = await prisma.user.findFirst({
      where: { username: body.username.replace(/^@+/, "").trim().toLowerCase() },
    });
  }
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === session!.user.id) {
    return NextResponse.json({ error: "You are already in your own crew" }, { status: 400 });
  }

  await prisma.crewMember.upsert({
    where: { userId_crewUserId: { userId: session!.user.id, crewUserId: target.id } },
    create: { userId: session!.user.id, crewUserId: target.id },
    update: {},
  });
  return NextResponse.json(await listCrew(session!.user.id));
}

export async function DELETE(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await prisma.crewMember.deleteMany({
    where: { userId: session!.user.id, crewUserId: userId },
  });
  return NextResponse.json(await listCrew(session!.user.id));
}
