"use client";

import type { MarketplaceListing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { CreateListingModal } from "@/components/forms/CreateListingModal";
import { ArrowLeftRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  listings: MarketplaceListing[];
};

export function MyMarketplaceContent({ listings }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const active = listings.filter((l) => !l.soldAt);
  const sold = listings.filter((l) => l.soldAt);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/marketplace"
        className="mb-4 inline-block text-sm text-zinc-500 transition hover:text-white"
      >
        ← Back to Exchange
      </Link>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">My listings</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Manage what you’re selling</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/marketplace/trades"
            className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-zinc-400 ring-1 ring-zinc-800/70 transition hover:text-zinc-200"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Trade offers
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            New listing
          </button>
        </div>
      </header>

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">Active</h2>
            <p className="text-xs text-zinc-500">Listings still for sale</p>
          </div>
          {active.length > 0 ? (
            <span className="text-[11px] tabular-nums text-zinc-600">{active.length}</span>
          ) : null}
        </div>
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-4 py-10 text-center">
            <p className="text-sm text-zinc-500">No active listings.</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-3 text-sm font-medium text-amber-400 hover:text-amber-300"
            >
              List something
            </button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {active.map((listing) => (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="flex gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3 transition hover:border-zinc-700/80 hover:bg-zinc-900/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={listing.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{listing.title}</p>
                  <p className="text-sm font-semibold text-amber-400">{formatPrice(listing.price)}</p>
                  <p className="truncate text-xs text-zinc-500">{listing.location}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {sold.length > 0 ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">Sold</h2>
              <p className="text-xs text-zinc-500">Archive of completed sales</p>
            </div>
            <span className="text-[11px] tabular-nums text-zinc-600">{sold.length}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sold.map((listing) => (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="flex gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-3 opacity-75 transition hover:opacity-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={listing.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover grayscale" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{listing.title}</p>
                  <p className="text-xs text-zinc-500">Sold</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <CreateListingModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
