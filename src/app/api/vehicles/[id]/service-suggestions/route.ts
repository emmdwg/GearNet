import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { ServiceSuggestion } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const INTERVALS: { category: string; label: string; miles: number }[] = [
  { category: "oil", label: "Oil change", miles: 5000 },
  { category: "tires", label: "Tire rotation", miles: 7500 },
  { category: "brakes", label: "Brake inspection", miles: 15000 },
  { category: "fluids", label: "Coolant / fluids", miles: 30000 },
];

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      maintenance: { orderBy: { performedAt: "desc" } },
    },
  });
  if (!vehicle) return NextResponse.json({ suggestions: [] });

  const latestMileage = vehicle.maintenance[0]?.mileage ?? 0;
  const suggestions: ServiceSuggestion[] = [];

  for (const interval of INTERVALS) {
    const last = vehicle.maintenance.find((log) => log.category.toLowerCase() === interval.category);
    const lastMiles = last?.mileage ?? 0;
    const dueByMileage = lastMiles + interval.miles;
    if (latestMileage >= dueByMileage - 500) {
      suggestions.push({
        category: interval.category,
        label: interval.label,
        reason: last
          ? `Last logged around ${lastMiles.toLocaleString()} mi`
          : "No recent log for this service",
        suggestedTitle: interval.label,
        dueByMileage,
        urgency: latestMileage >= dueByMileage ? "overdue" : "due_soon",
        vehicleId: id,
      });
    }
  }

  return NextResponse.json({ suggestions });
}
