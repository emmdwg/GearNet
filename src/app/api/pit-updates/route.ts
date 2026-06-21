import { getPitUpdates } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const updates = await getPitUpdates();
  return NextResponse.json(updates);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "pit-updates", 12, 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { image, caption } = body;

    if (!image || !caption?.trim()) {
      return NextResponse.json({ error: "Image and caption required" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const update = await prisma.pitUpdate.create({
      data: {
        userId: session!.user.id,
        image,
        caption: caption.trim(),
        expiresAt,
      },
      include: { user: true },
    });

    return NextResponse.json(
      {
        id: update.id,
        userId: update.userId,
        image: update.image,
        caption: update.caption,
        expiresAt: update.expiresAt.toISOString(),
        user: update.user
          ? {
              id: update.user.id,
              username: update.user.username,
              displayName: update.user.displayName,
              avatar: update.user.avatar,
            }
          : undefined,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create pit update" }, { status: 500 });
  }
}
