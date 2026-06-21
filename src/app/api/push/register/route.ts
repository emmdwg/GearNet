import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { token, platform } = await request.json();
    if (!token || !platform) {
      return NextResponse.json({ error: "Token and platform required" }, { status: 400 });
    }
    if (platform !== "web" && platform !== "expo") {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    await prisma.pushToken.upsert({
      where: { token },
      create: { userId: session!.user.id, token, platform },
      update: { userId: session!.user.id, platform },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to register push token" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  await prisma.pushToken.deleteMany({ where: { userId: session!.user.id, token } });
  return NextResponse.json({ ok: true });
}
