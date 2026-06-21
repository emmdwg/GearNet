"use client";

import { ImageEditorModal } from "@/components/ui/ImageEditorModal";
import { ChevronLeft, ChevronRight, GripVertical, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  maxImages?: number;
};

export function MultiImageUpload({ images, onChange, label = "Add photos", maxImages = 10 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<string | null>(null);

  async function uploadDataUrl(dataUrl: string) {
    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange([...images, data.url].slice(0, maxImages));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPendingFile(result);
      setEditorSrc(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
              <div className="relative aspect-[4/3]">
                <Image src={url} alt="" fill className="object-cover" sizes="200px" />
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 px-2 py-1.5">
                <GripVertical className="h-4 w-4 text-zinc-600" />
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(index, -1)} className="icon-btn" aria-label="Move left">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} className="icon-btn" aria-label="Move right">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(index)} className="icon-btn text-red-400" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-amber-500/50 hover:text-amber-400">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : `${label} (${images.length}/${maxImages})`}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      <ImageEditorModal
        open={Boolean(editorSrc)}
        imageSrc={editorSrc ?? ""}
        onClose={() => {
          setEditorSrc(null);
          setPendingFile(null);
        }}
        onSave={(edited) => {
          uploadDataUrl(edited);
          setPendingFile(null);
        }}
      />
    </div>
  );
}
