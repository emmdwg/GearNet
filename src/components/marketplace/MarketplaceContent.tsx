"use client";

import { CreateListingModal } from "@/components/forms/CreateListingModal";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Car, Map, Plus, Search, Zap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const MarketplaceMapInner = dynamic(() => import("@/components/marketplace/MarketplaceMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-2xl border border-zinc-800/70 bg-zinc-900/30 text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

type Props = { listings: MarketplaceListing[] };

export function MarketplaceContent({ listings: initialListings }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showVerifiedShops, setShowVerifiedShops] = useState(true);
  const [fitsMyCars, setFitsMyCars] = useState(false);
  const [listings, setListings] = useState(initialListings);
  const [fitsLoading, setFitsLoading] = useState(false);
  const [fitsError, setFitsError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    setListings(initialListings);
  }, [initialListings]);

  useEffect(() => {
    if (!fitsMyCars || !user) {
      if (!fitsMyCars) setListings(initialListings);
      return;
    }
    let cancelled = false;
    setFitsLoading(true);
    setFitsError("");
    fetch("/api/marketplace?fitsMyCars=1")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(typeof data?.error === "string" ? data.error : "Couldn’t filter by fitment");
        return data;
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setListings(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setFitsError(e instanceof Error ? e.message : "Couldn’t filter by fitment");
        setFitsMyCars(false);
        setListings(initialListings);
      })
      .finally(() => {
        if (!cancelled) setFitsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fitsMyCars, user, initialListings]);

  useEffect(() => {
    if (!user || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords(null),
      { maximumAge: 120000 },
    );
  }, [user]);

  const filtered = useMemo(() => {
    let result = listings;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q),
      );
    }
    if (maxPrice) {
      const max = parseInt(maxPrice, 10);
      if (!Number.isNaN(max)) result = result.filter((l) => l.price <= max);
    }
    return result;
  }, [listings, search, maxPrice]);

  if (authLoading) {
    return <p className="p-8 text-center text-zinc-500">Loading exchange...</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
          <Zap className="h-6 w-6 text-zinc-950" />
        </div>
        <h1 className="text-xl font-bold text-white">Sign in to Exchange</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Browse listings, message sellers, and list parts from your builds.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/signin?callbackUrl=/marketplace"
            className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup?callbackUrl=/marketplace"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-amber-400 ring-1 ring-amber-500/30 transition hover:bg-amber-500/10"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const mapAvailable = Boolean(userCoords);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Exchange</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Parts, vehicles & trades near you</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href="/marketplace/mine"
            className="rounded-full px-3 py-2 text-xs font-medium text-zinc-400 ring-1 ring-zinc-800/70 transition hover:text-zinc-200 sm:text-sm"
          >
            My listings
          </Link>
          <Link
            href="/marketplace/trades"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-zinc-400 ring-1 ring-zinc-800/70 transition hover:text-zinc-200 sm:text-sm"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Trades
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Sell
          </button>
        </div>
      </header>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings…"
          className="w-full rounded-full border border-zinc-800/80 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/60 focus:outline-none"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max price ($)"
          className="w-full max-w-xs rounded-full border border-zinc-800/80 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setFitsMyCars((v) => !v)}
          disabled={fitsLoading}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition",
            fitsMyCars
              ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/35"
              : "bg-zinc-900/60 text-zinc-500 ring-1 ring-zinc-800/80 hover:text-zinc-300",
          )}
        >
          <Car className="h-3.5 w-3.5" />
          {fitsLoading ? "Checking…" : "Fits my cars"}
        </button>
        {fitsError ? <p className="text-sm text-red-400">{fitsError}</p> : null}
      </div>

      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">Listings</h2>
          <p className="text-xs text-zinc-500">Tap a listing for details, message, or trade</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mapAvailable ? (
            <div className="flex gap-1 rounded-full bg-zinc-900/70 p-1 ring-1 ring-zinc-800/70">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  viewMode === "list" ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  viewMode === "map" ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Map className="h-3.5 w-3.5" />
                Map
              </button>
            </div>
          ) : null}
          {viewMode === "map" && mapAvailable ? (
            <button
              type="button"
              onClick={() => setShowVerifiedShops((v) => !v)}
              className={cn(
                "rounded-full px-2.5 py-1.5 text-xs font-medium transition",
                showVerifiedShops
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/35"
                  : "bg-zinc-900/60 text-zinc-500 ring-1 ring-zinc-800/80 hover:text-zinc-300",
              )}
            >
              Shops
            </button>
          ) : null}
          {filtered.length > 0 ? (
            <span className="text-[11px] tabular-nums text-zinc-600">{filtered.length}</span>
          ) : null}
        </div>
      </div>

      {viewMode === "map" && mapAvailable ? (
        <div className="mb-6 h-96 overflow-hidden rounded-2xl border border-zinc-800/70">
          <MarketplaceMapInner
            listings={filtered}
            center={[userCoords!.lat, userCoords!.lng]}
            zoom={11}
            showVerifiedShops={showVerifiedShops}
          />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} variant="browse" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-12 text-center">
          <p className="text-base font-semibold text-white">No listings found</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            List something yourself, or check parts in your garage.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              List an item
            </button>
            <Link
              href="/garage"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-400 ring-1 ring-zinc-800/80 transition hover:text-zinc-200"
            >
              Browse Garage
            </Link>
          </div>
        </div>
      )}

      <CreateListingModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
