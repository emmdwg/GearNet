import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) return null;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return cloudinary;
}

export async function uploadImage(base64OrUrl: string, folder = "gearnet") {
  const cloud = getCloudinary();
  if (!cloud) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_* env vars or provide an image URL.");
  }

  const result = await cloud.uploader.upload(base64OrUrl, {
    folder,
    resource_type: "image",
  });

  return { url: result.secure_url, publicId: result.public_id };
}
