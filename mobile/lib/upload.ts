import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { API_URL, getAuthToken } from "./api";

async function cropSquare(uri: string, width: number, height: number) {
  const size = Math.min(width, height);
  const originX = Math.floor((width - size) / 2);
  const originY = Math.floor((height - size) / 2);
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { originX, originY, width: size, height: size } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return `data:image/jpeg;base64,${result.base64}`;
}

async function cropLandscape(uri: string, width: number, height: number) {
  const targetRatio = 4 / 3;
  let cropW = width;
  let cropH = height;
  const ratio = width / height;
  if (ratio > targetRatio) cropW = Math.floor(height * targetRatio);
  else cropH = Math.floor(width / targetRatio);
  const originX = Math.floor((width - cropW) / 2);
  const originY = Math.floor((height - cropH) / 2);
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { originX, originY, width: cropW, height: cropH } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return `data:image/jpeg;base64,${result.base64}`;
}

export async function pickImage(crop: "none" | "square" | "landscape" = "none"): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to upload images.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.9,
    base64: crop === "none",
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  if (crop === "square" && asset.width && asset.height) {
    return cropSquare(asset.uri, asset.width, asset.height);
  }
  if (crop === "landscape" && asset.width && asset.height) {
    return cropLandscape(asset.uri, asset.width, asset.height);
  }

  if (!asset.base64) return null;
  const mime = asset.mimeType ?? "image/jpeg";
  return `data:${mime};base64,${asset.base64}`;
}

export async function pickAvatarImage(): Promise<string | null> {
  return pickImage("square");
}

export async function pickCoverImage(): Promise<string | null> {
  return pickImage("landscape");
}

export async function uploadImage(imageData: string, folder = "uploads"): Promise<string> {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ image: imageData, folder }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

export async function pickAndUploadImage(folder = "uploads", crop: "none" | "square" | "landscape" = "none"): Promise<string | null> {
  const picked = await pickImage(crop);
  if (!picked) return null;
  return uploadImage(picked, folder);
}
