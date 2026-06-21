"use client";

import { DEFAULT_AVATAR } from "@/lib/constants";
import { ImageEditorModal } from "@/components/ui/ImageEditorModal";
import { Camera } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  size?: "md" | "lg" | "xl";
  uploadOnPick?: boolean;
};

const sizes = { md: 64, lg: 80, xl: 112 };

export function AvatarPicker({ value, onChange, label = "Profile photo", size = "xl", uploadOnPick = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [error, setError] = useState("");
  const px = sizes[size];

  async function finishPick(dataUrl: string) {
    if (!uploadOnPick) {
      onChange(dataUrl);
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, folder: "avatars" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const src = value || DEFAULT_AVATAR;

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="group relative overflow-hidden rounded-full ring-2 ring-zinc-800 ring-offset-2 ring-offset-zinc-950 transition-all hover:ring-amber-500/60 disabled:opacity-60"
          style={{ width: px, height: px }}
          aria-label={label}
        >
          <Image src={src} alt="" fill className="object-cover" sizes={`${px}px`} />
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </span>
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white">...</span>
          ) : null}
        </button>
        <p className="text-xs text-zinc-500">{uploading ? "Uploading..." : label}</p>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setCropSrc(reader.result as string);
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
      </div>
      {cropSrc ? (
        <ImageEditorModal
          open
          imageSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onSave={(edited) => {
            setCropSrc(null);
            finishPick(edited);
          }}
          defaultCropMode="square"
        />
      ) : null}
    </>
  );
}
