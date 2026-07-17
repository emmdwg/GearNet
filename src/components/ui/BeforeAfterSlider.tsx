"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DISPLAY_QUALITY } from "@/lib/image-quality";

type Props = {
  before: string;
  after: string;
  alt?: string;
  className?: string;
};

export function BeforeAfterSlider({ before, after, alt = "Before and after", className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingX = useRef<number | null>(null);

  const flushPosition = useCallback(() => {
    rafRef.current = null;
    const clientX = pendingX.current;
    if (clientX == null) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const updatePosition = useCallback(
    (clientX: number) => {
      pendingX.current = clientX;
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(flushPosition);
    },
    [flushPosition],
  );

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    e.preventDefault();
    e.stopPropagation();
    updatePosition(e.clientX);
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false;
    e.stopPropagation();
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingX.current != null) flushPosition();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-[4/5] w-full touch-none select-none overflow-hidden bg-zinc-900",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => e.stopPropagation()}
      role="slider"
      aria-label="Compare before and after"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setPosition((p) => Math.max(0, p - 5));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setPosition((p) => Math.min(100, p + 5));
        }
      }}
    >
      <Image
        src={after}
        alt={`${alt} after`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 800px"
        quality={DISPLAY_QUALITY}
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          willChange: "clip-path",
        }}
      >
        <Image
          src={before}
          alt={`${alt} before`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          quality={DISPLAY_QUALITY}
          draggable={false}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-lg"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/60 text-[10px] font-bold text-white">
          ↔
        </div>
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Before
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        After
      </span>
    </div>
  );
}
