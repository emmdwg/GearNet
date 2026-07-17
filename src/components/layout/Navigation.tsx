"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Compass,
  Download,
  FolderOpen,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShoppingBag,
  Users,
  Wrench,
  Warehouse,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth-context";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useScrollChrome } from "@/lib/scroll-chrome";

const navItems = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/activity", label: "Activity", icon: Bell },
  { href: "/garage", label: "Garage", icon: Warehouse },
  { href: "/events", label: "Meets", icon: CalendarDays },
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/marketplace", label: "Exchange", icon: ShoppingBag },
  { href: "/chat", label: "Cruise Chat", icon: MessageCircle },
  { href: "/bench", label: "Service Bench", icon: Wrench },
];

/* Match Expo tab bar: fewer items so tap targets stay ≥44px on phones. */
const mobileNavItems = navItems.filter((item) =>
  ["/explore", "/garage", "/events", "/clubs", "/marketplace", "/chat"].includes(item.href)
);

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
        <Link
          href="/install"
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          Install app
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
        href="/collections"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
      >
        <FolderOpen className="h-4 w-4" />
        Collections
      </Link>
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>
      <Link
        href="/install"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
      >
        <Download className="h-4 w-4" />
        Install app
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
  const unreadMessages = useUnreadMessages();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
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
          const badgeCount =
            href === "/activity" ? unread : href === "/chat" ? unreadMessages : 0;
          const showBadge = badgeCount > 0;
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
                    {badgeCount > 9 ? "9+" : badgeCount}
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
          <Link href="/install" className="hover:text-zinc-400">
            Install
          </Link>
          <span>·</span>
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
  const { hidden } = useScrollChrome();
  const unreadMessages = useUnreadMessages();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-background transition-transform duration-200 ease-out lg:hidden",
        hidden && "pointer-events-none translate-y-full"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-hidden={hidden}
    >
      <div className="flex h-[var(--mobile-nav-h)] items-stretch justify-around px-1">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const shortLabel = label === "Cruise Chat" ? "Chat" : label.split(" ")[0];
          const showChatBadge = href === "/chat" && unreadMessages > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium",
                active ? "text-amber-400" : "text-zinc-500"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {showChatBadge ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-zinc-950">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                ) : null}
              </span>
              {shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
