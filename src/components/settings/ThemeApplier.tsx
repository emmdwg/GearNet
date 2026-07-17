"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

const STORAGE_KEY = "gearnet-theme";

function resolveTheme(theme: string): "light" | "dark" {
  if (theme === "light") return "light";
  if (theme === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return "dark";
}

function applyThemeClass(theme: string) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);
  document.documentElement.dataset.theme = resolved;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeApplier() {
  const { user } = useAuth();

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) applyThemeClass(cached);

    if (!user) return;

    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings?.theme) applyThemeClass(data.settings.theme);
      })
      .catch(() => null);
  }, [user]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) applyThemeClass(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}

export function persistThemeChoice(theme: string) {
  applyThemeClass(theme);
}
