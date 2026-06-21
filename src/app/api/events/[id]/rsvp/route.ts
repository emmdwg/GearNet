import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId: id, userId: session!.user.id } },
    });

    if (existing) {
      await prisma.eventRsvp.delete({ where: { id: existing.id } });
      await prisma.event.update({ where: { id }, data: { attendeeCount: { decrement: 1 } } });
      return NextResponse.json({ rsvped: false });
    }

    await prisma.eventRsvp.create({ data: { eventId: id, userId: session!.user.id } });
    await prisma.event.update({ where: { id }, data: { attendeeCount: { increment: 1 } } });
    return NextResponse.json({ rsvped: true });
  } catch {
    return NextResponse.json({ error: "RSVP failed" }, { status: 500 });
  }
}
