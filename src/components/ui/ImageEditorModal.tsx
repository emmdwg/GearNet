"use client";

import { ChevronLeft, ChevronRight, RotateCw, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (editedDataUrl: string) => void;
  defaultCropMode?: "free" | "square" | "landscape";
};

export function ImageEditorModal({ open, imageSrc, onClose, onSave, defaultCropMode = "free" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [cropMode, setCropMode] = useState<"free" | "square" | "landscape">("free");

  useEffect(() => {
    if (!open) return;
    setRotation(0);
    setBrightness(100);
    setCropMode(defaultCropMode);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageSrc]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, brightness, cropMode]);

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radians = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const width = img.width * cos + img.height * sin;
    const height = img.width * sin + img.height * cos;

    canvas.width = width;
    canvas.height = height;

    ctx.filter = `brightness(${brightness}%)`;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(radians);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    if (cropMode !== "free") {
      const targetRatio = cropMode === "square" ? 1 : 4 / 3;
      let cropW = width;
      let cropH = height;
      const currentRatio = width / height;
      if (currentRatio > targetRatio) cropW = height * targetRatio;
      else cropH = width / targetRatio;
      const sx = (width - cropW) / 2;
      const sy = (height - cropH) / 2;
      const cropped = ctx.getImageData(sx, sy, cropW, cropH);
      canvas.width = cropW;
      canvas.height = cropH;
      ctx.putImageData(cropped, 0, 0);
    }
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/jpeg", 0.9));
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-white">Edit Photo</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-4 overflow-hidden rounded-lg bg-zinc-900">
          <canvas ref={canvasRef} className="mx-auto max-h-[50vh] w-auto" />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRotation((r) => r + 90)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-amber-500/50 hover:text-amber-400"
          >
            <RotateCw className="h-4 w-4" /> Rotate
          </button>
          <button
            type="button"
            onClick={() => setCropMode("square")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-amber-500/50 hover:text-amber-400"
          >
            1:1 Crop
          </button>
          <button
            type="button"
            onClick={() => setCropMode("landscape")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-amber-500/50 hover:text-amber-400"
          >
            4:3 Crop
          </button>
          <button
            type="button"
            onClick={() => setCropMode("free")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-amber-500/50 hover:text-amber-400"
          >
            Full
          </button>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <Sun className="h-4 w-4 text-zinc-400" />
          <input
            type="range"
            min={60}
            max={140}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="flex-1"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 hover:bg-amber-400"
        >
          Apply Edits
        </button>
      </div>
    </div>
  );
}
