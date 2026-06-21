import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.vehicle.findUnique({ where: { id }, select: { userId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session!.user.id) {
      return NextResponse.json({ error: "You can only edit your own vehicles" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.year !== undefined && !Number.isNaN(Number(body.year))) data.year = parseInt(body.year, 10);
    if (typeof body.make === "string") data.make = body.make.trim();
    if (typeof body.model === "string") data.model = body.model.trim();
    if (typeof body.trim === "string") data.trim = body.trim.trim() || null;
    if (typeof body.color === "string") data.color = body.color.trim();
    if (typeof body.image === "string" && body.image) data.image = body.image;

    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json(vehicle);
  } catch (err) {
    console.error("PATCH /api/vehicles/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.vehicle.findUnique({ where: { id }, select: { userId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session!.user.id) {
      return NextResponse.json({ error: "You can only delete your own vehicles" }, { status: 403 });
    }

    // Modifications, build logs, and maintenance logs cascade via the schema.
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/vehicles/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
