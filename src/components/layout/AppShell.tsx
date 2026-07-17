"use client";

import { Sidebar, MobileNav } from "./Navigation";
import { ScrollChromeProvider, useScrollChrome } from "@/lib/scroll-chrome";
import { MainScrollChrome } from "@/hooks/useScrollChromeListener";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function ShellBody({ children }: { children: React.ReactNode }) {
  const { hidden } = useScrollChrome();

  return (
    <div className="flex min-h-dvh bg-background text-zinc-100">
      <Sidebar />
      <MainScrollChrome
        className={cn(
          "min-h-0 flex-1 overflow-y-auto transition-[padding-bottom] duration-200 lg:pb-0",
          hidden ? "pb-0" : "pb-[var(--mobile-nav-total)]"
        )}
      >
        {children}
      </MainScrollChrome>
      <MobileNav />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) {
    return <div className="min-h-dvh bg-background text-zinc-100">{children}</div>;
  }

  return (
    <ScrollChromeProvider>
      <ShellBody>{children}</ShellBody>
    </ScrollChromeProvider>
  );
}
