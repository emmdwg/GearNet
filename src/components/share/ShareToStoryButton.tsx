"use client";

import { downloadStoryBlob, renderGarageStoryCard, renderPostStoryCard } from "@/lib/share-card";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type PostProps = {
  kind: "post";
  postId: string;
  imageUrl: string;
  username: string;
  displayName: string;
  caption: string;
};

type GarageProps = {
  kind: "garage";
  username: string;
  displayName: string;
  coverImageUrl: string;
  vehicleCount: number;
  modCount: number;
};

type VehicleProps = {
  kind: "vehicle";
  vehicleId: string;
  username: string;
  displayName: string;
  coverImageUrl: string;
  year: number;
  make: string;
  model: string;
};

type Props = (PostProps | GarageProps | VehicleProps) & { className?: string; label?: string };

export function ShareToStoryButton({ className = "", label = "Share to story", ...props }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [alwaysWatermark, setAlwaysWatermark] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAlwaysWatermark(Boolean(data?.settings?.alwaysWatermarkExports)))
      .catch(() => {});
  }, []);

  async function handleShare() {
    setLoading(true);
    setMsg("");
    const origin = typeof window !== "undefined" ? window.location.origin : "https://gearnetapp.com";
    const pageUrl =
      props.kind === "post"
        ? `${origin}/post/${props.postId}`
        : props.kind === "vehicle"
          ? `${origin}/garage/vehicle/${props.vehicleId}`
          : `${origin}/garage/${props.username}`;
    try {
      let blob: Blob;
      if (props.kind === "post") {
        blob = await renderPostStoryCard({
          imageUrl: props.imageUrl,
          username: props.username,
          displayName: props.displayName,
          caption: props.caption,
          watermarkLabel: alwaysWatermark ? `@${props.username}` : undefined,
        });
        await downloadStoryBlob(blob, `gearnet-post-${props.postId}.png`);
      } else if (props.kind === "vehicle") {
        try {
          const res = await fetch(`/api/share/vehicle/${props.vehicleId}`);
          if (!res.ok) throw new Error("share api failed");
          blob = await res.blob();
        } catch {
          blob = await renderGarageStoryCard({
            coverImageUrl: props.coverImageUrl,
            username: props.username,
            displayName: `${props.year} ${props.make} ${props.model}`,
            vehicleCount: 1,
            modCount: 0,
            headline: "BUILD PORTFOLIO",
          });
        }
        await downloadStoryBlob(blob, `gearnet-vehicle-${props.vehicleId}.png`);
      } else {
        blob = await renderGarageStoryCard({
          coverImageUrl: props.coverImageUrl,
          username: props.username,
          displayName: props.displayName,
          vehicleCount: props.vehicleCount,
          modCount: props.modCount,
        });
        await downloadStoryBlob(blob, `gearnet-garage-${props.username}.png`);
      }
      try {
        await navigator.clipboard.writeText(pageUrl);
        setMsg("Saved PNG · link copied");
      } catch {
        setMsg("Saved PNG");
      }
      setTimeout(() => setMsg(""), 2500);
    } catch {
      const fallback =
        props.kind === "post"
          ? `/api/share/post/${props.postId}`
          : props.kind === "vehicle"
            ? `/api/share/vehicle/${props.vehicleId}`
            : `/api/share/garage/${props.username}`;
      window.open(fallback, "_blank");
      try {
        await navigator.clipboard.writeText(pageUrl);
        setMsg("Opened image · link copied");
      } catch {
        setMsg("Opened image");
      }
      setTimeout(() => setMsg(""), 2500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={loading}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        {label}
      </button>
      {msg ? <p className="px-3 pb-1 text-xs text-amber-400">{msg}</p> : null}
    </div>
  );
}
