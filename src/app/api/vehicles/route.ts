import { imagesToJson, normalizeImages, primaryImage } from "@/lib/social";
import { requireAuth } from "@/lib/api-helpers";
import { getUserVehicles } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { normalizeProjectStatus } from "@/lib/vehicle-meta";
import { allocateVehicleSlug } from "@/lib/vehicle-slug";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const vehicles = await getUserVehicles(session!.user.id, { includeSensitive: true });
  return NextResponse.json(vehicles);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "vehicles", 20, 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const year = Number(body.year);
    const make = String(body.make ?? "").trim();
    const model = String(body.model ?? "").trim();
    if (!year || !make || !model) {
      return NextResponse.json({ error: "Year, make, and model are required" }, { status: 400 });
    }

    const slug = await allocateVehicleSlug(prisma, year, make, model);
    const story =
      typeof body.story === "string" ? body.story.trim().slice(0, 500) || null : null;
    const projectStatus =
      body.projectStatus === null || body.projectStatus === ""
        ? null
        : normalizeProjectStatus(typeof body.projectStatus === "string" ? body.projectStatus : null);
    if (typeof body.projectStatus === "string" && body.projectStatus.trim() && !projectStatus) {
      return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
    }

    let installHours: number | null = null;
    if (body.installHours !== undefined && body.installHours !== null && body.installHours !== "") {
      const hours = Number(body.installHours);
      if (Number.isNaN(hours) || hours < 0) {
        return NextResponse.json({ error: "Invalid install hours" }, { status: 400 });
      }
      installHours = Math.min(100000, Math.round(hours));
    }

    const gallery = normalizeImages(body);
    const primary = gallery.length > 0 ? primaryImage(gallery) : body.image;

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: session!.user.id,
        year,
        make,
        model,
        trim: body.trim,
        color: body.color,
        image: primary,
        images: imagesToJson(gallery.length > 0 ? gallery : primary ? [primary] : []),
        slug,
        story,
        vin: typeof body.vin === "string" ? body.vin.trim().toUpperCase() || null : null,
        projectStatus,
        buildProgress:
          typeof body.buildProgress === "number"
            ? Math.min(100, Math.max(0, Math.round(body.buildProgress)))
            : null,
        installHours,
        waitingOnParts: Boolean(body.waitingOnParts),
        waitingOnPartsNote:
          typeof body.waitingOnPartsNote === "string"
            ? body.waitingOnPartsNote.trim().slice(0, 200) || null
            : null,
        forSale: Boolean(body.forSale),
      },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
