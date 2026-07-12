"use client";

import type { MaintenanceLog, ShopSummary, ShopRatingSummary } from "@/lib/types";
import { Star, Store, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  logs: MaintenanceLog[];
  onFilterShop?: (shopName: string | null) => void;
  activeShop?: string | null;
};

function StarDisplay({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-zinc-600"}
          style={{ width: size, height: size }}
        />
      ))}
    </span>
  );
}

export function ShopsPanel({ logs, onFilterShop, activeShop }: Props) {
  const [shops, setShops] = useState<ShopSummary[]>([]);
  const [ratings, setRatings] = useState<Record<string, ShopRatingSummary>>({});
  const [loading, setLoading] = useState(true);
  const [ratingShop, setRatingShop] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRatings = useCallback(async (shopList: ShopSummary[]) => {
    const entries = await Promise.all(
      shopList.map(async (shop) => {
        const res = await fetch(`/api/shops/ratings?shopName=${encodeURIComponent(shop.name)}`);
        if (!res.ok) return [shop.name, null] as const;
        const data = (await res.json()) as ShopRatingSummary;
        return [shop.name, data] as const;
      }),
    );
    setRatings(Object.fromEntries(entries.filter(([, v]) => v != null)) as Record<string, ShopRatingSummary>);
  }, []);

  useEffect(() => {
    fetch("/api/shops?scope=mine")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setShops(list);
        return loadRatings(list);
      })
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [loadRatings]);

  async function submitRating() {
    if (!ratingShop || ratingValue < 1) return;
    setSaving(true);
    try {
      const res = await fetch("/api/shops/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName: ratingShop, rating: ratingValue, review: review.trim() || undefined }),
      });
      if (res.ok) {
        await loadRatings(shops);
        setRatingShop(null);
        setReview("");
        setRatingValue(0);
      }
    } finally {
      setSaving(false);
    }
  }

  function openRating(shopName: string) {
    const existing = ratings[shopName]?.userRating?.rating;
    setRatingShop(shopName);
    setRatingValue(existing ?? 0);
    setReview(ratings[shopName]?.userRating?.review ?? "");
  }

  if (loading) return null;
  if (shops.length === 0) return null;

  const shopLogCount = (name: string) => logs.filter((l) => l.shopName === name).length;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Store className="h-4 w-4 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Shop Visit History</h2>
      </div>
      {activeShop ? (
        <button
          type="button"
          onClick={() => onFilterShop?.(null)}
          className="mb-3 text-xs text-amber-400 hover:text-amber-300"
        >
          Clear filter: {activeShop}
        </button>
      ) : null}
      <div className="grid grid-cols-2 gap-2.5">
        {shops.map((shop) => {
          const rating = ratings[shop.name];
          return (
            <div
              key={shop.name}
              className={`rounded-xl border p-3 transition-colors ${
                activeShop === shop.name
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              }`}
            >
              <button type="button" onClick={() => onFilterShop?.(shop.name)} className="w-full text-left">
                <p className="text-sm font-semibold text-white">{shop.name}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {shop.visitCount} visit{shop.visitCount !== 1 ? "s" : ""}
                  {shop.lastVisit
                    ? ` · Last ${new Date(shop.lastVisit).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : ""}
                </p>
                {onFilterShop ? (
                  <p className="mt-1 text-[10px] text-zinc-600">{shopLogCount(shop.name)} logs on bench</p>
                ) : null}
              </button>
              <div className="mt-1 flex items-center gap-2">
                {rating?.averageRating ? (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400">
                    <StarDisplay value={rating.averageRating} size={10} />
                    {rating.averageRating.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-600">No ratings yet</span>
                )}
                <button
                  type="button"
                  onClick={() => openRating(shop.name)}
                  className="text-[10px] text-amber-500 hover:text-amber-400"
                >
                  Rate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {ratingShop ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-white">Rate {ratingShop}</p>
              <button type="button" onClick={() => setRatingShop(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRatingValue(n)} className="p-1">
                  <Star
                    className={`h-7 w-7 ${n <= ratingValue ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Optional short review"
              rows={2}
              className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={ratingValue < 1 || saving}
              onClick={submitRating}
              className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save rating"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
