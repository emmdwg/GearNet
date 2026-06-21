import { requireAuth } from "@/lib/api-helpers";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isStorageConfigured, uploadImage } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "upload", 30, 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { image, folder = "uploads" } = body;

    if (!image) {
      return NextResponse.json({ error: "Image data required" }, { status: 400 });
    }

    const result = await uploadImage(session!.user.id, image, folder);
    return NextResponse.json({
      url: result.url,
      provider: result.provider,
      path: result.path,
      configured: isStorageConfigured() || isCloudinaryConfigured(),
      uploadedBy: session!.user.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    storage: isStorageConfigured(),
    cloudinary: isCloudinaryConfigured(),
    provider: isStorageConfigured() ? "supabase" : isCloudinaryConfigured() ? "cloudinary" : "none",
  });
}
