import * as ImagePicker from "expo-image-picker";
import { API_URL, getAuthToken } from "./api";

export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to upload images.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets[0]?.base64) return null;

  const asset = result.assets[0];
  const mime = asset.mimeType ?? "image/jpeg";
  return `data:${mime};base64,${asset.base64}`;
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

export async function pickAndUploadImage(folder = "uploads"): Promise<string | null> {
  const picked = await pickImage();
  if (!picked) return null;
  return uploadImage(picked, folder);
}
