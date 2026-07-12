import { computeDiySavings } from "@/lib/diy-savings";
import { getMaintenanceLogs } from "@/lib/db";
import { getServiceManualsPayload, normalizeServiceManualsPayload } from "@/lib/manual-catalog/service";
import { inferServiceType } from "@/lib/maintenance-service-type";
import { nextMaintenanceStreak } from "@/lib/maintenance-streak";
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
    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { maintenanceStreak: true, lastMaintenanceAt: true },
    });
    const logs = await prisma.maintenanceLog.findMany({
      where: { userId: session!.user.id },
      select: { category: true, cost: true, shopName: true, serviceType: true },
    });
    const savings = computeDiySavings(logs);
    return NextResponse.json({
      maintenanceStreak: user?.maintenanceStreak ?? 0,
      lastMaintenanceAt: user?.lastMaintenanceAt?.toISOString() ?? null,
      diySavings: savings.saved,
      diyCount: savings.diyCount,
      shopCount: savings.shopCount,
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
    const performedAt = new Date(body.performedAt);
    const shopName = body.shopName?.trim() || null;
    const serviceType = inferServiceType(shopName, body.serviceType);

    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { maintenanceStreak: true, lastMaintenanceAt: true },
    });

    const streakUpdate = nextMaintenanceStreak(
      user?.maintenanceStreak ?? 0,
      user?.lastMaintenanceAt,
      performedAt,
    );

    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          userId: session!.user.id,
          vehicleId: body.vehicleId,
          title: body.title,
          description: body.description,
          mileage: body.mileage,
          cost: body.cost,
          category: body.category,
          performedAt,
          receiptImage: body.receiptImage ?? null,
          shopName,
          serviceType,
          reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
          nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
          nextDueMileage: body.nextDueMileage != null ? parseInt(body.nextDueMileage, 10) : null,
          difficulty:
            body.difficulty != null && body.difficulty !== ""
              ? Math.min(5, Math.max(1, parseInt(body.difficulty, 10)))
              : null,
        },
      }),
      prisma.user.update({
        where: { id: session!.user.id },
        data: streakUpdate,
      }),
    ]);

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
