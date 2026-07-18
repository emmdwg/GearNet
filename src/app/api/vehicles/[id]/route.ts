import { requireAuth } from "@/lib/api-helpers";
import { getVehicleById } from "@/lib/db";
import { getProfileViewContext } from "@/lib/privacy";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { normalizeProjectStatus } from "@/lib/vehicle-meta";
import { allocateVehicleSlug } from "@/lib/vehicle-slug";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();
    const vehicle = await getVehicleById(id, session?.user?.id);
    if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const view = await getProfileViewContext(vehicle.userId, session?.user?.id);
    if (!view.canViewGarage) {
      return NextResponse.json({ error: "This garage is private" }, { status: 403 });
    }

    return NextResponse.json(vehicle);
  } catch (err) {
    console.error("GET /api/vehicles/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load vehicle" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.vehicle.findUnique({
      where: { id },
      select: { userId: true, year: true, make: true, model: true, slug: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session!.user.id) {
      return NextResponse.json({ error: "You can only edit your own vehicles" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.year !== undefined && !Number.isNaN(Number(body.year))) data.year = parseInt(body.year, 10);
    if (typeof body.make === "string") data.make = body.make.trim();
    if (typeof body.model === "string") data.model = body.model.trim();
    if (typeof body.trim === "string") data.trim = body.trim.trim() || null;
    if (typeof body.color === "string") data.color = body.color.trim();
    if (typeof body.image === "string" && body.image) data.image = body.image;
    if (Array.isArray(body.images) || typeof body.image === "string") {
      const { imagesToJson, normalizeImages, primaryImage } = await import("@/lib/social");
      const gallery = normalizeImages(body);
      if (gallery.length > 0) {
        data.images = imagesToJson(gallery);
        data.image = primaryImage(gallery);
      }
    }
    if (typeof body.vin === "string") data.vin = body.vin.trim().toUpperCase() || null;
    if (typeof body.story === "string") data.story = body.story.trim().slice(0, 500) || null;
    if (body.projectStatus !== undefined) {
      if (body.projectStatus === null || body.projectStatus === "") {
        data.projectStatus = null;
      } else if (typeof body.projectStatus === "string") {
        const status = normalizeProjectStatus(body.projectStatus);
        if (!status) return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
        data.projectStatus = status;
      }
    }
    if (body.buildProgress !== undefined && body.buildProgress !== null && body.buildProgress !== "") {
      const progress = parseInt(String(body.buildProgress), 10);
      if (!Number.isNaN(progress)) data.buildProgress = Math.min(100, Math.max(0, progress));
    }
    if (body.installHours !== undefined) {
      if (body.installHours === null || body.installHours === "") {
        data.installHours = null;
      } else {
        const hours = Number(body.installHours);
        if (Number.isNaN(hours) || hours < 0) {
          return NextResponse.json({ error: "Invalid install hours" }, { status: 400 });
        }
        data.installHours = Math.min(100000, Math.round(hours));
      }
    }
    if (typeof body.waitingOnParts === "boolean") data.waitingOnParts = body.waitingOnParts;
    if (body.waitingOnPartsNote === null || typeof body.waitingOnPartsNote === "string") {
      data.waitingOnPartsNote =
        typeof body.waitingOnPartsNote === "string"
          ? body.waitingOnPartsNote.trim().slice(0, 200) || null
          : null;
    }
    if (body.fluidNotes === null || typeof body.fluidNotes === "string") {
      data.fluidNotes = typeof body.fluidNotes === "string" ? body.fluidNotes.trim() || null : null;
    }
    if (typeof body.forSale === "boolean") data.forSale = body.forSale;

    const nextYear = (data.year as number | undefined) ?? existing.year;
    const nextMake = (data.make as string | undefined) ?? existing.make;
    const nextModel = (data.model as string | undefined) ?? existing.model;
    const identityChanged =
      nextYear !== existing.year || nextMake !== existing.make || nextModel !== existing.model;
    if (!existing.slug || identityChanged) {
      data.slug = await allocateVehicleSlug(prisma, nextYear, nextMake, nextModel, id);
    }

    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json(vehicle);
  } catch (err) {
    console.error("PATCH /api/vehicles/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.vehicle.findUnique({ where: { id }, select: { userId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session!.user.id) {
      return NextResponse.json({ error: "You can only delete your own vehicles" }, { status: 403 });
    }

    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/vehicles/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
