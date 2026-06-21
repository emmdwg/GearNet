import { requireAuth } from "@/lib/api-helpers";
import { getUserVehicles } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const vehicles = await getUserVehicles(session!.user.id);
  return NextResponse.json(vehicles);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "vehicles", 20, 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: session!.user.id,
        year: body.year,
        make: body.make,
        model: body.model,
        trim: body.trim,
        color: body.color,
        image: body.image,
      },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
