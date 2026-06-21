"use client";

import { ImageEditorModal } from "@/components/ui/ImageEditorModal";
import { Camera } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  uploadOnPick?: boolean;
  className?: string;
};

export function CoverPicker({ value, onChange, uploadOnPick = true, className = "h-32" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function upload(dataUrl: string) {
    if (!uploadOnPick) {
      onChange(dataUrl);
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, folder: "covers" }),
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

  return (
    <>
      <div className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${className}`}>
        {value ? (
          <Image src={value} alt="" fill className="object-cover" sizes="640px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950" />
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/35 text-sm text-white opacity-0 transition-opacity hover:opacity-100 disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
          {uploading ? "Uploading..." : "Change cover banner"}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
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
      {cropSrc ? (
        <ImageEditorModal
          open
          imageSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onSave={(edited) => {
            setCropSrc(null);
            upload(edited);
          }}
          defaultCropMode="landscape"
        />
      ) : null}
    </>
  );
}
