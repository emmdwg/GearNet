import { getVehicleIndexMeta, searchManualCatalog } from "@/lib/manual-catalog";
import { withResolvedManuals } from "@/lib/manual-catalog/group-manuals";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("meta") === "index") {
    return NextResponse.json(getVehicleIndexMeta());
  }
  const q = searchParams.get("q") ?? "";
  const make = searchParams.get("make") ?? undefined;
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "60", 10) || 60, 120);

  if (searchParams.get("meta") === "makes") {
    const { getManualMakes } = await import("@/lib/manual-catalog");
    const meta = getVehicleIndexMeta();
    return NextResponse.json({ makes: getManualMakes(), vehicleCount: meta.vehicleCount, phase: meta.phase });
  }

  const { results, total } = searchManualCatalog(q, {
    limit,
    suggestionLimit: 0,
    make,
    year: year && !Number.isNaN(year) ? year : undefined,
  });

  return NextResponse.json({ results: withResolvedManuals(results), total });
}
