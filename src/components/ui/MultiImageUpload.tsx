"use client";

import { ImageEditorModal } from "@/components/ui/ImageEditorModal";
import { DISPLAY_QUALITY } from "@/lib/image-quality";
import { uploadImageFromDataUrl } from "@/lib/upload-client";
import { Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  maxImages?: number;
  folder?: string;
  watermarkUsername?: string;
  showCounter?: boolean;
};

export function MultiImageUpload({
  images,
  onChange,
  label = "Add",
  maxImages = 20,
  folder = "uploads",
  watermarkUsername,
  showCounter = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [blurPlates, setBlurPlates] = useState(false);
  const [alwaysBlurPlates, setAlwaysBlurPlates] = useState(false);
  const [defaultWatermark, setDefaultWatermark] = useState(false);
  const pendingQueue = useRef<string[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.settings) return;
        const alwaysBlur = Boolean(data.settings.alwaysBlurPlates);
        setAlwaysBlurPlates(alwaysBlur);
        setBlurPlates(alwaysBlur || Boolean(data.settings.alwaysBlurPlates));
        setDefaultWatermark(Boolean(data.settings.alwaysWatermarkExports));
      })
      .catch(() => {});
  }, []);

  async function uploadDataUrl(dataUrl: string, replaceIndex?: number) {
    setUploading(true);
    setError("");
    const totalPending = pendingQueue.current.length + 1;
    const currentIndex = Math.max(1, totalPending - pendingQueue.current.length);
    try {
      const url = await uploadImageFromDataUrl(dataUrl, folder, (percent) => {
        setUploadProgress(
          totalPending > 1
            ? `Uploading ${currentIndex}/${totalPending} · ${percent}%`
            : `Uploading ${percent}%`
        );
      });

      if (replaceIndex !== undefined) {
        const next = [...images];
        next[replaceIndex] = url;
        onChange(next);
      } else {
        onChange([...images, url].slice(0, maxImages));
      }
      setEditorSrc(null);
      setEditIndex(null);

      const nextPending = pendingQueue.current.shift();
      if (nextPending && images.length + (replaceIndex === undefined ? 1 : 0) < maxImages) {
        setEditIndex(null);
        setEditorSrc(nextPending);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setEditorSrc(null);
      setEditIndex(null);
      pendingQueue.current = [];
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    const remaining = maxImages - images.length;
    const selected = Array.from(files).slice(0, remaining);

    if (selected.length === 1) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditIndex(null);
        setEditorSrc(reader.result as string);
      };
      reader.onerror = () => setError("Could not read that photo");
      reader.readAsDataURL(selected[0]);
    } else if (selected.length > 1) {
      pendingQueue.current = [];
      let loaded = 0;
      const queue: string[] = new Array(selected.length);
      selected.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          queue[index] = reader.result as string;
          loaded += 1;
          if (loaded === selected.length) {
            pendingQueue.current = queue.slice(1);
            setEditIndex(null);
            setEditorSrc(queue[0]);
          }
        };
        reader.onerror = () => setError("Could not read a photo");
        reader.readAsDataURL(file);
      });
    }
    e.target.value = "";
  }

  return (
    <div>
      {showCounter ? (
        <p className="mb-2 text-xs text-zinc-500">
          {images.length} of {maxImages} photos
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, index) => (
          <div key={`${url}-${index}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
            <button
              type="button"
              onClick={() => {
                pendingQueue.current = [];
                setEditIndex(index);
                setEditorSrc(url);
              }}
              className="relative block h-full w-full"
              aria-label="Edit photo"
            >
              <Image src={url} alt="" fill className="object-cover" sizes="80px" quality={DISPLAY_QUALITY} />
            </button>
            <button
              type="button"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {images.length < maxImages ? (
          <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white">
            {uploading ? (
              <span className="px-1 text-center text-[9px] leading-tight">{uploadProgress || "…"}</span>
            ) : (
              <>
                <Plus className="h-6 w-6" />
                <span className="mt-1 text-[10px] font-medium">{label}</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      {uploadProgress && !error ? <p className="mt-2 text-xs text-amber-400">{uploadProgress}</p> : null}

      {alwaysBlurPlates ? (
        <p className="mt-2 text-xs text-amber-400/90">Plate blur is always on (your settings)</p>
      ) : (
        <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={blurPlates} onChange={(e) => setBlurPlates(e.target.checked)} className="accent-amber-500" />
          Blur plates (auto strip + manual regions in editor)
        </label>
      )}

      <ImageEditorModal
        open={Boolean(editorSrc)}
        imageSrc={editorSrc ?? ""}
        saving={uploading}
        blurPlates={blurPlates}
        watermarkUsername={watermarkUsername}
        defaultWatermark={defaultWatermark}
        onClose={() => {
          if (uploading) return;
          setEditorSrc(null);
          setEditIndex(null);
          pendingQueue.current = [];
        }}
        onSave={(edited) => {
          void uploadDataUrl(edited, editIndex ?? undefined);
        }}
      />
    </div>
  );
}
