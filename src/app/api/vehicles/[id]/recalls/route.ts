import { requireAuth } from "@/lib/api-helpers";
import { nhtsaTsbs } from "@/lib/manual-catalog/urls";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { year: true, make: true, model: true, userId: true },
  });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSession();
  let recalls: unknown[] = [];
  try {
    const res = await fetch(nhtsaTsbs(vehicle.make, vehicle.model, vehicle.year));
    if (res.ok) {
      const data = await res.json();
      recalls = Array.isArray(data.results) ? data.results : [];
    }
  } catch {
    recalls = [];
  }

  const acks = session?.user?.id
    ? await prisma.recallAck.findMany({
        where: { userId: session.user.id, vehicleId: id },
        select: { campaignNumber: true },
      })
    : [];

  return NextResponse.json({
    recalls,
    acknowledged: acks.map((a) => a.campaignNumber),
  });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const campaignNumber = typeof body.campaignNumber === "string" ? body.campaignNumber : "";
  if (!campaignNumber) {
    return NextResponse.json({ error: "campaignNumber required" }, { status: 400 });
  }

  await prisma.recallAck.upsert({
    where: {
      userId_vehicleId_campaignNumber: {
        userId: session!.user.id,
        vehicleId: id,
        campaignNumber,
      },
    },
    create: { userId: session!.user.id, vehicleId: id, campaignNumber },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
