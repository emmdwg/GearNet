"use client";

import { useAuth } from "@/lib/auth-context";
import { BellOff } from "lucide-react";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushPromptBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!user || !publicKey) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "granted" || Notification.permission === "denied") return;
    setVisible(true);
  }, [user, publicKey]);

  if (!user || !visible || !publicKey) return null;

  async function enable() {
    if (!publicKey) return;
    setLoading(true);
    setError("");
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushNotifications: true }),
      });
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(permission === "denied" ? "Blocked in browser settings." : "Permission not granted.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const res = await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: JSON.stringify(sub.toJSON()), platform: "web" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Couldn’t enable notifications");
      }
      setVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t enable notifications");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-center gap-3">
        <BellOff className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">Turn on browser notifications</p>
          <p className="text-xs text-zinc-500">Get alerts for likes, follows, meets & messages.</p>
        </div>
        <button
          type="button"
          onClick={() => void enable()}
          disabled={loading}
          className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-50"
        >
          {loading ? "..." : "Enable"}
        </button>
        <button type="button" onClick={() => setVisible(false)} className="text-zinc-500 hover:text-zinc-300">
          ×
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
