import { getNearbyPosts, mapSerializedPost } from "@/lib/db";
import { inferCityFromLocation } from "@/lib/city";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 50);
  const limit = Number(searchParams.get("limit") ?? 20);
  const home = searchParams.get("home") === "1";

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const posts = await getNearbyPosts(lat, lng, radius || 50, limit || 20, session?.user?.id);
    return NextResponse.json(posts, { headers: { "X-Near-You-Source": "gps" } });
  }

  if (home) {
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Add a home city in Settings to use Near You without GPS", code: "HOME_AREA_REQUIRED" },
        { status: 400 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { location: true },
    });
    const city = inferCityFromLocation(user?.location ?? "");
    if (!city) {
      return NextResponse.json(
        { error: "Add a home city in Settings to use Near You without GPS", code: "HOME_AREA_REQUIRED" },
        { status: 400 },
      );
    }
    const posts = await prisma.post.findMany({
      where: {
        clubId: null,
        status: "published",
        user: { location: { contains: city, mode: "insensitive" } },
      },
      include: { user: true, vehicle: true },
      orderBy: { createdAt: "desc" },
      take: limit || 20,
    });
    return NextResponse.json(posts.map(mapSerializedPost), { headers: { "X-Near-You-Source": "home" } });
  }

  return NextResponse.json(
    { error: "Location required", code: "HOME_AREA_REQUIRED" },
    { status: 400 },
  );
}
