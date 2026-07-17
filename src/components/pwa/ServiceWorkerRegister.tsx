"use client";

import { useEffect } from "react";

/** Registers the push/offline service worker early so Chromium can offer Install. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      /* ignore — install UI still works via Add to Home Screen */
    });
  }, []);

  return null;
}
