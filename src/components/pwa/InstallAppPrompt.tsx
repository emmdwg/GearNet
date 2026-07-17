"use client";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Download, Share, Smartphone, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "gearnet-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectPlatform() {
  if (typeof window === "undefined") {
    return { isIOS: false, isAndroid: false, isDesktop: true, isStandalone: false, isSafari: false };
  }
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const isSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  const isDesktop = !isIOS && !isAndroid;
  return { isIOS, isAndroid, isDesktop, isStandalone, isSafari };
}

export function useInstallApp() {
  const [platform, setPlatform] = useState(detectPlatform);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const next = detectPlatform();
    setPlatform(next);
    setInstalled(next.isStandalone);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  return { ...platform, deferredPrompt, installed, canNativeInstall: Boolean(deferredPrompt), promptInstall };
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="mt-3 space-y-2 text-sm text-zinc-400">{children}</ol>;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

/** Full install instructions — used on /install and Settings. */
export function InstallAppPanel({ className }: { className?: string }) {
  const { isIOS, isAndroid, isDesktop, installed, canNativeInstall, promptInstall } = useInstallApp();

  if (installed) {
    return (
      <div className={cn("rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4", className)}>
        <p className="text-sm font-medium text-white">GearNet is installed on this device</p>
        <p className="mt-1 text-xs text-zinc-500">Open it from your home screen for the full app experience.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/40 p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500">
          <Zap className="h-6 w-6 text-zinc-950" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Install GearNet</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Free home-screen app — no App Store or Apple Developer account needed.
          </p>
        </div>
      </div>

      {canNativeInstall ? (
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
        >
          <Download className="h-4 w-4" />
          Install app
        </button>
      ) : null}

      {isIOS ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">On iPhone / iPad (Safari)</p>
          <Steps>
            <Step n={1}>
              Tap the <Share className="mx-0.5 inline h-3.5 w-3.5 text-amber-400" aria-label="Share" /> Share button
            </Step>
            <Step n={2}>
              Scroll and tap <span className="font-medium text-zinc-200">Add to Home Screen</span>
            </Step>
            <Step n={3}>
              Tap <span className="font-medium text-zinc-200">Add</span> — GearNet opens like an app
            </Step>
          </Steps>
          <p className="mt-3 text-xs text-zinc-600">
            Use Safari (not Chrome/Instagram in-app browsers). There is no App Store or TestFlight download.
          </p>
        </div>
      ) : null}

      {isAndroid && !canNativeInstall ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">On Android (Chrome)</p>
          <Steps>
            <Step n={1}>Open the browser menu (⋮)</Step>
            <Step n={2}>
              Tap <span className="font-medium text-zinc-200">Install app</span> or{" "}
              <span className="font-medium text-zinc-200">Add to Home screen</span>
            </Step>
          </Steps>
        </div>
      ) : null}

      {isDesktop ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">On desktop</p>
          {canNativeInstall ? (
            <p className="mt-2 text-sm text-zinc-400">
              Use the Install button above, or the install icon in your browser address bar (Chrome / Edge).
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              In Chrome or Edge, look for the install icon in the address bar. For the best experience, open{" "}
              <span className="text-zinc-300">gearnetapp.com</span> on your phone and add it to your home screen.
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500">
            <Smartphone className="h-4 w-4 shrink-0 text-amber-400" />
            Mobile: Safari → Share → Add to Home Screen · Android Chrome → Install app
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Dismissible banner for logged-in explore feed. */
export function InstallAppBanner() {
  const { user } = useAuth();
  const { installed, canNativeInstall, isIOS, promptInstall } = useInstallApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || installed) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, [user, installed]);

  if (!user || !visible || installed) return null;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">Install GearNet on your phone</p>
          <p className="text-xs text-zinc-500">
            {isIOS
              ? "Add to Home Screen for a full-screen app — free, no App Store."
              : "Home screen shortcut for faster access — free install."}
          </p>
        </div>
        {canNativeInstall ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
          >
            Install
          </button>
        ) : (
          <Link
            href="/install"
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
          >
            Install
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
          className="text-zinc-500 hover:text-zinc-300"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
