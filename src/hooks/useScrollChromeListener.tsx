"use client";

import { useEffect, useRef } from "react";
import { useScrollChrome } from "@/lib/scroll-chrome";

/** Attach Facebook-style chrome hide/show to a scrollable element. */
export function useScrollChromeListener(
  scrollRef: React.RefObject<HTMLElement | null> | null,
  enabled = true
) {
  const { reportScroll } = useScrollChrome();

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef?.current;
    if (!el) return;

    const onScroll = () => reportScroll(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, reportScroll, enabled]);
}

/** Attach chrome listener to the AppShell `<main>` element. */
export function MainScrollChrome({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useScrollChromeListener(ref);

  return (
    <main ref={ref} className={className}>
      {children}
    </main>
  );
}
