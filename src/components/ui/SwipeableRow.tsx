"use client";

import { useRef, type ReactNode } from "react";

type SwipeableRowProps = {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDelete?: () => void;
  threshold?: number;
  className?: string;
};

export function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  onDelete,
  threshold = 72,
  className,
}: SwipeableRowProps) {
  const startX = useRef<number | null>(null);

  return (
    <div
      className={className}
      onTouchStart={(e) => {
        startX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? startX.current) - startX.current;
        startX.current = null;
        if (dx <= -threshold) (onSwipeLeft ?? onDelete)?.();
        if (dx >= threshold) onSwipeRight?.();
      }}
    >
      {children}
    </div>
  );
}
