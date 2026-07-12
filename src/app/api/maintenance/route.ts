import { getMaintenanceLogs } from "@/lib/db";
import { getServiceManualsPayload, normalizeServiceManualsPayload } from "@/lib/manual-catalog/service";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("type") === "manuals") {
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "48", 10) || 48, 200);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);
    try {
      const data = getServiceManualsPayload(limit, offset);
      return NextResponse.json(normalizeServiceManualsPayload(data));
    } catch (error) {
      console.error("GET /api/maintenance?type=manuals failed:", error);
      return NextResponse.json(normalizeServiceManualsPayload(null));
    }
  }

  if (searchParams.get("type") === "summary") {
    const { session, error } = await requireAuth();
    if (error) return error;
    // Compatible with production schema (streak columns may not exist yet).
    return NextResponse.json({
      maintenanceStreak: 0,
      lastMaintenanceAt: null,
      diySavings: 0,
      diyCount: 0,
      shopCount: 0,
      userId: session!.user.id,
    });
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
