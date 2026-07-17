"use client";

import { DISPLAY_QUALITY, DISPLAY_QUALITY_FULL } from "@/lib/image-quality";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
  variant?: "card" | "viewer";
  className?: string;
  onImageClick?: () => void;
};

const SWIPE_THRESHOLD = 48;
const VELOCITY_THRESHOLD = 0.35;

export function ImageCarousel({ images, alt, variant = "card", className, onImageClick }: Props) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const velocityRef = useRef(0);
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const didSwipeRef = useRef(false);
  const indexRef = useRef(0);

  const slides = images.length > 0 ? images : ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop"];
  const isViewer = variant === "viewer";
  const count = slides.length;

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const measure = useCallback(() => {
    const el = trackRef.current?.parentElement;
    if (el) widthRef.current = el.clientWidth;
  }, []);

  useEffect(() => {
    measure();
    const el = trackRef.current?.parentElement;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(count - 1, next));
      setIndex(clamped);
      setDragOffset(0);
    },
    [count],
  );

  function prev() {
    goTo(indexRef.current - 1);
  }

  function next() {
    goTo(indexRef.current + 1);
  }

  function finishDrag() {
    const offset = dragOffsetRef.current;
    const velocity = velocityRef.current;
    let target = indexRef.current;

    if (offset > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      target -= 1;
    } else if (offset < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD) {
      target += 1;
    }

    if (Math.abs(offset) > 12 || Math.abs(velocity) > 0.2) {
      didSwipeRef.current = true;
    }

    dragOffsetRef.current = 0;
    goTo(target);
    setDragging(false);
    axisLockRef.current = null;
    pointerIdRef.current = null;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (count < 2) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    measure();
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
    velocityRef.current = 0;
    axisLockRef.current = null;
    didSwipeRef.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pointerIdRef.current !== e.pointerId || !dragging) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!axisLockRef.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axisLockRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      if (axisLockRef.current === "y") return;
    }
    if (axisLockRef.current === "y") return;

    e.preventDefault();
    const now = performance.now();
    const dt = Math.max(1, now - lastTRef.current);
    velocityRef.current = (e.clientX - lastXRef.current) / dt;
    lastXRef.current = e.clientX;
    lastTRef.current = now;

    const width = widthRef.current || 1;
    const atStart = indexRef.current === 0 && dx > 0;
    const atEnd = indexRef.current === count - 1 && dx < 0;
    const resisted = atStart || atEnd ? dx * 0.35 : dx;
    const nextOffset = Math.max(-width, Math.min(width, resisted));
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (pointerIdRef.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (axisLockRef.current === "y" || !dragging) {
      setDragging(false);
      dragOffsetRef.current = 0;
      setDragOffset(0);
      pointerIdRef.current = null;
      axisLockRef.current = null;
      return;
    }
    finishDrag();
  }

  function handleClick() {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    onImageClick?.();
  }

  const width = widthRef.current || 1;
  const translate = -index * 100 + (dragging ? (dragOffset / width) * 100 : 0);

  return (
    <div
      className={cn(
        "relative w-full touch-pan-y overflow-hidden bg-zinc-800",
        isViewer ? "h-[50vh] min-h-[320px] lg:h-[80vh]" : "aspect-[4/5]",
        onImageClick && "cursor-zoom-in",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onImageClick ? handleClick : undefined}
      role={onImageClick ? "button" : undefined}
      tabIndex={onImageClick ? 0 : undefined}
      onKeyDown={
        onImageClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onImageClick();
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                prev();
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                next();
              }
            }
          : (e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                prev();
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                next();
              }
            }
      }
    >
      <div
        ref={trackRef}
        className="flex h-full w-full will-change-transform"
        style={{
          transform: `translate3d(${translate}%, 0, 0)`,
          transition: dragging ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {slides.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-full w-full shrink-0 grow-0 basis-full">
            <Image
              src={src}
              alt={alt}
              fill
              className={isViewer ? "object-contain" : "object-cover"}
              sizes={isViewer ? "100vw" : "(max-width: 768px) 100vw, 800px"}
              quality={isViewer ? DISPLAY_QUALITY_FULL : DISPLAY_QUALITY}
              unoptimized={isViewer}
              priority={isViewer || i === index}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
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
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-4 bg-amber-400" : "w-1.5 bg-white/40",
                )}
              />
            ))}
          </div>
          <div className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            {index + 1}/{count}
          </div>
        </>
      )}
    </div>
  );
}
