import { getVehicleById } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const image = vehicle.image || vehicle.images?.[0];
  if (typeof image === "string" && image.startsWith("http")) {
    return NextResponse.redirect(image);
  }
  return NextResponse.json({
    id: vehicle.id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    image: vehicle.image,
  });
}
