import { requireAuth } from "@/lib/api-helpers";
import { NextResponse } from "next/server";

/**
 * Community tips — temporarily schema-safe stubs until ManualGuideNote
 * is migrated on production. Manual catalog search/browse is unaffected.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make")?.trim();
  const model = searchParams.get("model")?.trim();

  if (!make || !model) {
    return NextResponse.json({ error: "make and model required" }, { status: 400 });
  }

  return NextResponse.json({ notes: [] });
}

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const vehicleMake = body.vehicleMake?.trim();
    const vehicleModel = body.vehicleModel?.trim();
    const section = body.section?.trim();
    const tip = body.tip?.trim();

    if (!vehicleMake || !vehicleModel || !section || !tip) {
      return NextResponse.json(
        { error: "vehicleMake, vehicleModel, section, and tip required" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Community tips are temporarily unavailable while we finish a database upgrade." },
      { status: 503 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to add tip" }, { status: 500 });
  }
}
