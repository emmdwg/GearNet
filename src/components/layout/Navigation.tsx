"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Compass,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShoppingBag,
  Wrench,
  Warehouse,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth-context";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const navItems = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/activity", label: "Activity", icon: Bell },
  { href: "/garage", label: "Garage", icon: Warehouse },
  { href: "/events", label: "Meets", icon: CalendarDays },
  { href: "/marketplace", label: "Exchange", icon: ShoppingBag },
  { href: "/chat", label: "Cruise Chat", icon: MessageCircle },
  { href: "/bench", label: "Service Bench", icon: Wrench },
];

const mobileNavItems = navItems.filter((item) => item.href !== "/search");

function UserFooter() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="space-y-2">
        <Link
          href="/auth/signin"
          className="block rounded-lg bg-amber-500 px-3 py-2 text-center text-sm font-semibold text-zinc-950 hover:bg-amber-400"
        >
          Sign In
        </Link>
        <Link href="/auth/signup" className="block text-center text-xs text-zinc-500 hover:text-white">
          Create account
        </Link>
      </div>
    );
  }

  const username = user.username ?? "profile";

  return (
    <div className="space-y-2">
      <Link
        href={`/profile/${username}`}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
      >
        <Avatar
          src={user.image ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop"}
          alt={user.name ?? "User"}
          size="sm"
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-zinc-500">@{username}</p>
        </div>
      </Link>
      <Link
        href="/saved"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
      >
        <Bookmark className="h-4 w-4" />
        Saved
      </Link>
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/explore");
          router.refresh();
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-white"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const unread = useUnreadNotifications();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500">
          <Zap className="h-5 w-5 text-zinc-950" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white">GearNet</span>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Drive. Build. Connect.</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const showBadge = href === "/activity" && unread > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-amber-500/10 text-amber-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-zinc-950">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <UserFooter />
        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-zinc-600">
          <Link href="/terms" className="hover:text-zinc-400">
            Terms
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-zinc-400">
            Privacy
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const unread = useUnreadNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const showBadge = href === "/activity" && unread > 0;
          const shortLabel = label === "Cruise Chat" ? "Chat" : label === "Service Bench" ? "Bench" : label.split(" ")[0];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[9px] font-medium sm:px-3 sm:text-[10px]",
                active ? "text-amber-400" : "text-zinc-500"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[8px] font-bold text-zinc-950">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              {shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
