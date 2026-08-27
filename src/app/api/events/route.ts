import { getEvents } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const events = await getEvents();
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const clubId = typeof body.clubId === "string" ? body.clubId : null;
    if (clubId) {
      const member = await prisma.clubMember.findUnique({
        where: { clubId_userId: { clubId, userId: session!.user.id } },
      });
      if (!member) {
        return NextResponse.json({ error: "Join the club to create a meet" }, { status: 403 });
      }
    }

    const post = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        city: body.city,
        date: new Date(body.date),
        time: body.time,
        organizerId: session!.user.id,
        maxAttendees: body.maxAttendees,
        tags: JSON.stringify(body.tags ?? []),
        image: body.image || null,
        clubId,
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
