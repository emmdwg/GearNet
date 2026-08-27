import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const vin = typeof body.vin === "string" ? body.vin.trim().toUpperCase() : "";
  if (vin.length < 11) {
    return NextResponse.json({ error: "VIN looks incomplete" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`);
    if (!res.ok) throw new Error("NHTSA unavailable");
    const data = await res.json();
    const row = Array.isArray(data.Results) ? data.Results[0] : null;
    return NextResponse.json({
      year: row?.ModelYear ? Number(row.ModelYear) : undefined,
      make: row?.Make || undefined,
      model: row?.Model || undefined,
      trim: row?.Trim || row?.Series || undefined,
    });
  } catch {
    return NextResponse.json({ error: "Could not decode VIN" }, { status: 502 });
  }
}
