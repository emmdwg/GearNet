import { requireAuth } from "@/lib/api-helpers";
import { createNotification } from "@/lib/social";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true },
    take: 5,
  });
  for (const admin of admins) {
    try {
      await createNotification({
        userId: admin.id,
        actorId: session!.user.id,
        type: "verified_shop_request",
        targetType: "user",
        targetId: session!.user.id,
        title: "Verified shop request",
        body: `${session!.user.name} requested verified shop status`,
      });
    } catch {
      // ignore
    }
  }
  return NextResponse.json({ ok: true });
}
