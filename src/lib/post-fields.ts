import { jsonArray } from "@/lib/api-helpers";

const VALID_POST_TYPES = new Set(["standard", "build", "before-after", "collab", "audio"]);

function sanitizeHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function buildPostLegendaryFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  if (body.vehicleId !== undefined) {
    data.vehicleId = typeof body.vehicleId === "string" && body.vehicleId ? body.vehicleId : null;
  }
  if (typeof body.postType === "string" && VALID_POST_TYPES.has(body.postType)) {
    data.postType = body.postType;
  }
  if (body.beforeImage !== undefined) {
    data.beforeImage =
      typeof body.beforeImage === "string" && body.beforeImage.trim() ? body.beforeImage.trim() : null;
  }
  if (body.afterImage !== undefined) {
    data.afterImage =
      typeof body.afterImage === "string" && body.afterImage.trim() ? body.afterImage.trim() : null;
  }
  if (body.inspiredByPostId !== undefined) {
    data.inspiredByPostId =
      typeof body.inspiredByPostId === "string" && body.inspiredByPostId ? body.inspiredByPostId : null;
  }
  if (Array.isArray(body.collaborators)) {
    data.collaborators = jsonArray(body.collaborators.map((c) => String(c).trim()).filter(Boolean));
  }
  if (body.audioUrl !== undefined) {
    data.audioUrl = typeof body.audioUrl === "string" ? body.audioUrl : null;
  }
  if (body.latitude !== undefined) {
    data.latitude = typeof body.latitude === "number" ? body.latitude : null;
  }
  if (body.longitude !== undefined) {
    data.longitude = typeof body.longitude === "number" ? body.longitude : null;
  }

  if (typeof body.isSponsored === "boolean") {
    data.isSponsored = body.isSponsored;
    if (!body.isSponsored) {
      data.sponsorName = null;
      data.sponsorUrl = null;
    }
  }
  if (body.sponsorName !== undefined) {
    data.sponsorName =
      typeof body.sponsorName === "string" ? body.sponsorName.trim().slice(0, 80) || null : null;
  }
  if (body.sponsorUrl !== undefined) {
    data.sponsorUrl = sanitizeHttpsUrl(body.sponsorUrl);
  }

  return data;
}
