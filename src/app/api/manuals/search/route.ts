import { searchManualCatalog } from "@/lib/manual-catalog";
import { parseVehicleSearchQuery } from "@/lib/manual-catalog/group-manuals";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const makeParam = searchParams.get("make") ?? undefined;
  const yearParam = searchParams.get("year");
  const yearParsed = yearParam ? parseInt(yearParam, 10) : undefined;
  const parsed = parseVehicleSearchQuery(q);
  const make = makeParam ?? parsed.make;
  const year = yearParsed && !Number.isNaN(yearParsed) ? yearParsed : parsed.year;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "48", 10) || 48, 200);
  const suggestionLimit = Math.min(parseInt(searchParams.get("suggestions") ?? "8", 10) || 8, 12);

  const data = searchManualCatalog(q, {
    limit,
    suggestionLimit,
    make,
    year,
  });

  return NextResponse.json(data);
}
