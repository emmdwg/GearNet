"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/marketplace/ListingCard";

type SimilarListingsStripProps = {
  listingId?: string;
  similarTo?: string;
};

export function SimilarListingsStrip({ listingId, similarTo }: SimilarListingsStripProps) {
  const id = similarTo ?? listingId ?? "";
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/marketplace/${id}/similar`)
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((data) => {
        if (!cancelled) setItems(data.listings ?? data.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Similar listings</h2>
        <Link href="/marketplace" className="text-xs text-amber-500 hover:underline">
          Browse all
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((listing) => (
          <ListingCard key={String(listing.id)} listing={listing as never} />
        ))}
      </div>
    </section>
  );
}
