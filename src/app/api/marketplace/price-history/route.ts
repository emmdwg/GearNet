import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const partNumber = searchParams.get("partNumber")?.trim();
  const fitmentTag = searchParams.get("fitmentTag")?.trim();

  const where = partNumber
    ? { partNumber, soldAt: { not: null } }
    : fitmentTag
      ? { fitmentTags: { contains: fitmentTag }, soldAt: { not: null } }
      : null;

  if (!where) return NextResponse.json({ min: 0, max: 0, avg: 0, count: 0, points: [] });

  const sold = await prisma.marketplaceListing.findMany({
    where,
    select: { soldPrice: true, price: true, soldAt: true },
    orderBy: { soldAt: "desc" },
    take: 40,
  });
  const points = sold
    .map((row) => ({
      price: row.soldPrice ?? row.price,
      soldAt: row.soldAt?.toISOString() ?? "",
    }))
    .filter((p) => p.soldAt);
  const count = points.length;
  if (count === 0) return NextResponse.json({ min: 0, max: 0, avg: 0, count: 0, points: [] });
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / count);
  return NextResponse.json({ min, max, avg, count, points });
}
