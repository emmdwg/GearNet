"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

type ImageUploadProps = {
  onUploaded: (url: string) => void;
  label?: string;
};

export function ImageUpload({ onUploaded, label = "Upload image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result as string }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        onUploaded(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-amber-500/50 hover:text-amber-400">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : label}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
