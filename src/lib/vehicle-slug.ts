import type { PrismaClient } from "@prisma/client";

function slugifyPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function allocateVehicleSlug(
  prisma: PrismaClient,
  year: number,
  make: string,
  model: string,
  excludeId?: string,
) {
  const base = [year, slugifyPart(make), slugifyPart(model)].filter(Boolean).join("-") || "vehicle";
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await prisma.vehicle.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}
