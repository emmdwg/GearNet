"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushRegistration({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "on" | "unsupported">("idle");
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !publicKey) {
      setStatus("unsupported");
    }
  }, [publicKey]);

  async function registerPush() {
    if (!publicKey) return;
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("idle");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: JSON.stringify(sub.toJSON()), platform: "web" }),
      });
      setStatus("on");
    } catch {
      setStatus("idle");
    }
  }

  if (status === "unsupported" || !enabled) return null;

  return (
    <button
      type="button"
      onClick={registerPush}
      disabled={status === "loading" || status === "on"}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 hover:border-amber-500/40 hover:text-white disabled:opacity-60"
    >
      {status === "on" ? <Bell className="h-4 w-4 text-emerald-400" /> : <BellOff className="h-4 w-4" />}
      {status === "on"
        ? "Browser notifications enabled"
        : status === "loading"
          ? "Enabling..."
          : "Enable browser notifications"}
    </button>
  );
}
