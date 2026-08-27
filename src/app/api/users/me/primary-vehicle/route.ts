import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const vehicleId =
    body.vehicleId === null || body.vehicleId === ""
      ? null
      : typeof body.vehicleId === "string"
        ? body.vehicleId
        : null;

  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.userId !== session!.user.id) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session!.user.id },
    data: { primaryVehicleId: vehicleId },
    include: { primaryVehicle: true },
  });

  return NextResponse.json({
    primaryVehicleId: user.primaryVehicleId,
    primaryVehicle: user.primaryVehicle,
  });
}
