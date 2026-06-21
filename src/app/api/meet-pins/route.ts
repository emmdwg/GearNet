import { getMeetPins } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(await getMeetPins());
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { title, description, latitude, longitude, address } = body;

    if (!title?.trim() || latitude == null || longitude == null) {
      return NextResponse.json({ error: "Title and coordinates required" }, { status: 400 });
    }

    const pin = await prisma.meetPin.create({
      data: {
        userId: session!.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        address: address?.trim() || null,
      },
      include: { user: true },
    });

    return NextResponse.json(
      {
        id: pin.id,
        userId: pin.userId,
        title: pin.title,
        description: pin.description ?? "",
        latitude: pin.latitude,
        longitude: pin.longitude,
        address: pin.address ?? "",
        createdAt: pin.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to add pin" }, { status: 500 });
  }
}
