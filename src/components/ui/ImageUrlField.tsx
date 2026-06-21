"use client";

import { ImageUpload } from "@/components/ui/ImageUpload";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export function ImageUrlField({ value, onChange, label = "Image" }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-zinc-400">{label}</label>
      <ImageUpload onUploaded={onChange} label="Upload image" />
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste an image URL"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
      />
    </div>
  );
}
