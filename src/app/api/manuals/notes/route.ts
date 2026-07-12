import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make")?.trim();
  const model = searchParams.get("model")?.trim();

  if (!make || !model) {
    return NextResponse.json({ error: "make and model required" }, { status: 400 });
  }

  try {
    const notes = await prisma.manualGuideNote.findMany({
      where: {
        vehicleMake: { equals: make, mode: "insensitive" },
        vehicleModel: { equals: model, mode: "insensitive" },
      },
      include: {
        user: { select: { username: true, displayName: true, avatar: true } },
      },
      orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        vehicleMake: n.vehicleMake,
        vehicleModel: n.vehicleModel,
        yearRange: n.yearRange,
        section: n.section,
        tip: n.tip,
        upvotes: n.upvotes,
        createdAt: n.createdAt.toISOString(),
        user: n.user,
      })),
    });
  } catch (err) {
    console.error("GET /api/manuals/notes failed:", err);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const vehicleMake = body.vehicleMake?.trim();
    const vehicleModel = body.vehicleModel?.trim();
    const section = body.section?.trim();
    const tip = body.tip?.trim();

    if (!vehicleMake || !vehicleModel || !section || !tip) {
      return NextResponse.json({ error: "vehicleMake, vehicleModel, section, and tip required" }, { status: 400 });
    }

    const note = await prisma.manualGuideNote.create({
      data: {
        userId: session!.user.id,
        vehicleMake,
        vehicleModel,
        yearRange: body.yearRange?.trim() || null,
        section,
        tip,
      },
      include: {
        user: { select: { username: true, displayName: true, avatar: true } },
      },
    });

    return NextResponse.json(
      {
        id: note.id,
        vehicleMake: note.vehicleMake,
        vehicleModel: note.vehicleModel,
        yearRange: note.yearRange,
        section: note.section,
        tip: note.tip,
        upvotes: note.upvotes,
        createdAt: note.createdAt.toISOString(),
        user: note.user,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/manuals/notes failed:", err);
    return NextResponse.json({ error: "Failed to add tip" }, { status: 500 });
  }
}
