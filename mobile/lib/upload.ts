import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { API_URL, getAuthToken } from "./api";
import { MANIPULATOR_COMPRESS, PICKER_QUALITY } from "./image-quality";
import { isDefaultAdjustments, type ImageAdjustments } from "./image-editor-presets";
import type { BlurRegion } from "./blur-regions";

async function cropSquare(uri: string, width: number, height: number) {
  const size = Math.min(width, height);
  const originX = Math.floor((width - size) / 2);
  const originY = Math.floor((height - size) / 2);
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { originX, originY, width: size, height: size } }],
    { compress: MANIPULATOR_COMPRESS, format: ImageManipulator.SaveFormat.JPEG, base64: false }
  );
  return result.uri;
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
    { compress: MANIPULATOR_COMPRESS, format: ImageManipulator.SaveFormat.JPEG, base64: false }
  );
  return result.uri;
}

function mimeFromUri(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  return "image/jpeg";
}

function extFromMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

export async function pickImage(crop: "none" | "square" | "landscape" = "none"): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to upload images.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: PICKER_QUALITY,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  if (crop === "square" && asset.width && asset.height) {
    return cropSquare(asset.uri, asset.width, asset.height);
  }
  if (crop === "landscape" && asset.width && asset.height) {
    return cropLandscape(asset.uri, asset.width, asset.height);
  }

  return asset.uri;
}

export async function pickAvatarImage(): Promise<string | null> {
  return pickImage("square");
}

export async function pickCoverImage(): Promise<string | null> {
  return pickImage("landscape");
}

export async function uploadVideo(
  uri: string,
  folder = "uploads",
  duration?: number,
  mimeType = "video/mp4"
): Promise<{ url: string; posterUrl?: string }> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", { uri, name: `video.${mimeType.includes("quicktime") ? "mov" : "mp4"}`, type: mimeType } as never);
  formData.append("folder", folder);
  formData.append("kind", "video");
  if (duration) formData.append("duration", String(duration));

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return { url: data.url as string };
}

export type ImageProcessOptions = {
  adjustments?: ImageAdjustments;
  blurRegions?: BlurRegion[];
  autoBlurPlates?: boolean;
  watermark?: string;
};

export async function processImageExtras(uri: string, options: ImageProcessOptions = {}): Promise<string> {
  const adjustments = options.adjustments ?? { brightness: 100, contrast: 100, saturation: 100 };
  const hasAdjustments = !isDefaultAdjustments(adjustments);
  const hasBlur = Boolean(options.autoBlurPlates || (options.blurRegions && options.blurRegions.length > 0));
  const hasWatermark = Boolean(options.watermark?.trim());
  if (!hasAdjustments && !hasBlur && !hasWatermark) return uri;

  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", { uri, name: "image.jpg", type: "image/jpeg" } as never);
  formData.append("adjustments", JSON.stringify(adjustments));
  if (options.blurRegions?.length) {
    formData.append("blurRegions", JSON.stringify(options.blurRegions));
  }
  if (options.autoBlurPlates) formData.append("autoBlurPlates", "true");
  if (options.watermark) formData.append("watermark", options.watermark);

  const res = await fetch(`${API_URL}/api/image/process`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not apply edits");
  return `data:${data.mime as string};base64,${data.base64 as string}`;
}

export async function processImageAdjustments(uri: string, adjustments: ImageAdjustments): Promise<string> {
  return processImageExtras(uri, { adjustments });
}

export async function uploadImage(
  imageData: string,
  folder = "uploads",
  onProgress?: (percent: number) => void
): Promise<string> {
  if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
    onProgress?.(100);
    return imageData;
  }

  const token = getAuthToken();
  const formData = new FormData();
  formData.append("folder", folder);
  formData.append("kind", "image");

  if (imageData.startsWith("file://") || imageData.startsWith("content://")) {
    const mime = mimeFromUri(imageData);
    const ext = extFromMime(mime);
    formData.append("file", { uri: imageData, name: `image.${ext}`, type: mime } as never);
  } else if (imageData.startsWith("data:")) {
    const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data");
    const mime = match[1];
    const ext = extFromMime(mime);
    const blobRes = await fetch(imageData);
    const blob = await blobRes.blob();
    formData.append("file", blob, `image.${ext}`);
  } else {
    throw new Error("Invalid image data");
  }

  // RN FormData uploads don't expose reliable byte progress; simulate while in-flight.
  let tick = 8;
  const timer = onProgress
    ? setInterval(() => {
        tick = Math.min(92, tick + 7);
        onProgress(tick);
      }, 180)
    : null;

  try {
    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    onProgress?.(100);
    return data.url as string;
  } finally {
    if (timer) clearInterval(timer);
  }
}

export async function pickAndUploadImage(folder = "uploads", crop: "none" | "square" | "landscape" = "none"): Promise<string | null> {
  const picked = await pickImage(crop);
  if (!picked) return null;
  return uploadImage(picked, folder);
}

export async function uploadAudio(uri: string, duration?: number, folder = "chat"): Promise<string> {
  const token = getAuthToken();
  const lower = uri.toLowerCase();
  const ext = lower.includes(".m4a") || lower.includes(".caf") ? "m4a" : "webm";
  const mime = ext === "m4a" ? "audio/mp4" : "audio/webm";
  const formData = new FormData();
  formData.append("file", { uri, name: `voice.${ext}`, type: mime } as never);
  formData.append("folder", folder);
  formData.append("kind", "audio");
  if (duration !== undefined) formData.append("duration", String(duration));

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}
