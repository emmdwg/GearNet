import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
    limit: "6",
  });
  if (lat && lng) params.set("viewbox", `${Number(lng) - 0.4},${Number(lat) + 0.3},${Number(lng) + 0.4},${Number(lat) - 0.3}`);

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        "User-Agent": "GearNet/1.0 (https://gearnetapp.com)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });
    const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    return NextResponse.json({
      suggestions: data.map((row) => ({
        label: row.display_name,
        lat: Number(row.lat),
        lng: Number(row.lon),
      })),
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
