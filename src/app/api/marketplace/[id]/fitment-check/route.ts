import { requireAuth } from "@/lib/api-helpers";
import { tagMatchesVehicle, type FitmentMatch } from "@/lib/marketplace-fitment";
import { parseJsonArray } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session!.user.id },
    select: { id: true, year: true, make: true, model: true },
  });
  const tags = parseJsonArray(listing.fitmentTags);
  const matches: FitmentMatch[] = vehicles.map((vehicle) => {
    const hit = tags.some((tag) => tagMatchesVehicle(tag, vehicle.year, vehicle.make, vehicle.model));
    const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    return {
      vehicleId: vehicle.id,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      label,
      matched: hit,
      match: hit ? "exact" : "none",
    };
  });

  return NextResponse.json({ matches, anyMatch: matches.some((m) => m.matched) });
}
