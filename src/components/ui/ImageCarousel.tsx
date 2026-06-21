"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
  variant?: "card" | "viewer";
  className?: string;
  onImageClick?: () => void;
};

export function ImageCarousel({ images, alt, variant = "card", className, onImageClick }: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const slides = images.length > 0 ? images : ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop"];
  const isViewer = variant === "viewer";

  function prev() {
    setIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === slides.length - 1 ? 0 : i + 1));
  }

  function handleTouchStart(clientX: number) {
    touchStartX.current = clientX;
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX.current === null) return;
    const diff = clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      didSwipe.current = true;
      if (diff > 50) prev();
      else next();
    }
    touchStartX.current = null;
  }

  function handleClick() {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    onImageClick?.();
  }

  return (
    <div
      className={cn(
        "relative w-full bg-zinc-800",
        isViewer ? "h-[50vh] min-h-[320px] lg:h-[80vh]" : "aspect-[3/2]",
        onImageClick && "cursor-zoom-in",
        className
      )}
      onTouchStart={(e) => handleTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientX)}
      onClick={onImageClick ? handleClick : undefined}
      role={onImageClick ? "button" : undefined}
      tabIndex={onImageClick ? 0 : undefined}
      onKeyDown={
        onImageClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onImageClick();
            }
          : undefined
      }
    >
      <Image
        src={slides[index]}
        alt={alt}
        fill
        className={isViewer ? "object-contain" : "object-cover"}
        sizes={isViewer ? "100vw" : "(max-width: 768px) 100vw, 800px"}
        priority={isViewer}
      />
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-amber-400" : "bg-white/40")} />
            ))}
          </div>
          <div className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            {index + 1}/{slides.length}
          </div>
        </>
      )}
    </div>
  );
}
