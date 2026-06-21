import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage as uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export const STORAGE_BUCKET = "gearnet";

export function isStorageConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function parseImageInput(image: string): { buffer: Buffer; contentType: string; ext: string } | null {
  if (image.startsWith("data:")) {
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const contentType = match[1];
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    return { buffer: Buffer.from(match[2], "base64"), contentType, ext };
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return null;
  }

  return null;
}

export async function uploadImage(
  userId: string,
  image: string,
  folder = "uploads"
): Promise<{ url: string; provider: "supabase" | "cloudinary" | "url"; path?: string }> {
  if (typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://"))) {
    return { url: image, provider: "url" };
  }

  if (isStorageConfigured()) {
    const parsed = parseImageInput(image);
    if (!parsed) {
      throw new Error("Invalid image data. Provide a base64 data URL or http(s) URL.");
    }

    const supabase = createAdminClient();
    const path = `${folder}/${userId}/${Date.now()}.${parsed.ext}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, parsed.buffer, {
      contentType: parsed.contentType,
      upsert: false,
    });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, provider: "supabase", path };
  }

  if (isCloudinaryConfigured()) {
    const result = await uploadToCloudinary(image, folder);
    return { url: result.url, provider: "cloudinary", path: result.publicId };
  }

  throw new Error(
    "No image storage configured. Set Supabase env vars or CLOUDINARY_* — or pass an image URL."
  );
}
