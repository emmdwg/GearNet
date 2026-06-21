import { requireAuth } from "@/lib/api-helpers";
import { getNotifications, getUnreadNotificationCount } from "@/lib/social";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const [items, unreadCount] = await Promise.all([
    getNotifications(session!.user.id),
    getUnreadNotificationCount(session!.user.id),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function PATCH() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await prisma.notification.updateMany({
    where: { userId: session!.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
