import { getMaintenanceLogs, getServiceManuals } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("type") === "manuals") {
    return NextResponse.json(await getServiceManuals());
  }

  const { session, error } = await requireAuth();
  if (session) {
    return NextResponse.json(await getMaintenanceLogs(session.user.id));
  }

  const userId = searchParams.get("userId");
  if (userId) {
    return NextResponse.json(await getMaintenanceLogs(userId));
  }

  if (error) return error;
  return NextResponse.json({ error: "userId required" }, { status: 400 });
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const log = await prisma.maintenanceLog.create({
      data: {
        userId: session!.user.id,
        vehicleId: body.vehicleId,
        title: body.title,
        description: body.description,
        mileage: body.mileage,
        cost: body.cost,
        category: body.category,
        performedAt: new Date(body.performedAt),
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
