"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type ScrollChromeContextValue = {
  hidden: boolean;
  /** Report vertical scroll position (scrollTop / offsetY). */
  reportScroll: (y: number) => void;
  show: () => void;
};

const ScrollChromeContext = createContext<ScrollChromeContextValue | null>(null);

const DOWN_DELTA = 10;
const UP_DELTA = 8;
const TOP_REVEAL = 24;

export function ScrollChromeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const hiddenRef = useRef(false);

  const show = useCallback(() => {
    hiddenRef.current = false;
    setHidden(false);
  }, []);

  const reportScroll = useCallback((y: number) => {
    const prev = lastY.current;
    const delta = y - prev;
    lastY.current = y;

    if (y <= TOP_REVEAL) {
      if (hiddenRef.current) {
        hiddenRef.current = false;
        setHidden(false);
      }
      return;
    }

    if (delta > DOWN_DELTA && !hiddenRef.current) {
      hiddenRef.current = true;
      setHidden(true);
    } else if (delta < -UP_DELTA && hiddenRef.current) {
      hiddenRef.current = false;
      setHidden(false);
    }
  }, []);

  useEffect(() => {
    lastY.current = 0;
    hiddenRef.current = false;
    setHidden(false);
  }, [pathname]);

  const value = useMemo(
    () => ({ hidden, reportScroll, show }),
    [hidden, reportScroll, show]
  );

  return <ScrollChromeContext.Provider value={value}>{children}</ScrollChromeContext.Provider>;
}

export function useScrollChrome() {
  const ctx = useContext(ScrollChromeContext);
  if (!ctx) {
    return {
      hidden: false,
      reportScroll: () => {},
      show: () => {},
    };
  }
  return ctx;
}
