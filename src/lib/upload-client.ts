export function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");

  const mime = match[1];
  const base64 = match[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function extFromMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

export async function uploadImageFromDataUrl(
  dataUrl: string,
  folder: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  const ext = extFromMime(blob.type);
  const formData = new FormData();
  formData.append("file", blob, `image.${ext}`);
  formData.append("folder", folder);
  formData.append("kind", "image");

  if (!onProgress || typeof XMLHttpRequest === "undefined") {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    onProgress?.(100);
    return data.url as string;
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(data.error ?? "Upload failed"));
          return;
        }
        onProgress(100);
        resolve(data.url as string);
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

export async function uploadAudioBlob(blob: Blob, duration?: number, folder = "chat"): Promise<string> {
  const ext = blob.type.includes("mp4") || blob.type.includes("m4a") ? "m4a" : "webm";
  const formData = new FormData();
  formData.append("file", blob, `voice.${ext}`);
  formData.append("folder", folder);
  formData.append("kind", "audio");
  if (duration !== undefined) formData.append("duration", String(duration));

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}
