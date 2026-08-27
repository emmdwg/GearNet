import { requireAuth } from "@/lib/api-helpers";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { referralCount: true, username: true },
  });
  const referrals = await prisma.user.findMany({
    where: { referredBy: session!.user.id },
    select: { username: true, displayName: true, createdAt: true, avatar: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    referralCount: user?.referralCount ?? referrals.length,
    referrals: referrals.map((r) => ({
      username: r.username,
      displayName: r.displayName,
      joinedAt: r.createdAt.toISOString(),
      avatar: r.avatar ?? DEFAULT_AVATAR,
    })),
  });
}
