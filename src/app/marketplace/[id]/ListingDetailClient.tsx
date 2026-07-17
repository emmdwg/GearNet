"use client";

import { ListingReportButton } from "@/components/marketplace/ListingReportButton";
import { EscrowPanel } from "@/components/marketplace/EscrowPanel";
import { ListingMessageButton } from "@/components/marketplace/ListingMessageButton";
import { ListingOwnerActions } from "@/components/marketplace/ListingOwnerActions";
import { SimilarListingsStrip } from "@/components/marketplace/SimilarListingsStrip";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/marketplace-categories";
import type { PriceHistory } from "@/lib/types";
import type { FitmentMatch } from "@/lib/marketplace-fitment";
import { ArrowLeft, ArrowLeftRight, Check, MapPin, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TradeOfferModal } from "@/components/marketplace/TradeOfferModal";
import { useAuth } from "@/lib/auth-context";

type ListingDetail = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  condition: string;
  image: string;
  images: string[];
  location: string;
  createdAt: string;
  tradeAccepted: boolean;
  fitmentTags?: string[];
  partNumber?: string;
  soldAt?: string | null;
  sellerVerified?: boolean;
  sellerVerifiedShop?: boolean;
  bookmarked: boolean;
  seller: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verifiedSeller?: boolean;
    isVerifiedShop?: boolean;
  };
};

export function ListingDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [error, setError] = useState("");
  const [tradeOpen, setTradeOpen] = useState(false);
  const [fitment, setFitment] = useState<{ matches: FitmentMatch[]; anyMatch: boolean } | null>(null);
  const [fitmentLoading, setFitmentLoading] = useState(false);
  const [fitmentError, setFitmentError] = useState("");
  const [comps, setComps] = useState<PriceHistory | null>(null);

  async function reloadListing() {
    const r = await fetch(`/api/marketplace/${id}`);
    const json = await r.json();
    if (!r.ok) throw new Error(json.error ?? "Not found");
    setListing(json);
  }

  useEffect(() => {
    reloadListing().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

  useEffect(() => {
    if (!listing) return;
    const params = listing.partNumber
      ? `partNumber=${encodeURIComponent(listing.partNumber)}`
      : listing.fitmentTags?.[0]
        ? `fitmentTag=${encodeURIComponent(listing.fitmentTags[0])}`
        : null;
    if (!params) return;
    fetch(`/api/marketplace/price-history?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (r.ok && json.count > 0) setComps(json);
      })
      .catch(() => {});
  }, [listing]);

  async function checkFitment() {
    if (!user) {
      router.push(`/auth/signin?callbackUrl=/marketplace/${id}`);
      return;
    }
    setFitmentLoading(true);
    setFitmentError("");
    try {
      const res = await fetch(`/api/marketplace/${id}/fitment-check`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setFitment(data);
      else setFitmentError(typeof data.error === "string" ? data.error : "Couldn’t check fitment");
    } catch {
      setFitmentError("Couldn’t check fitment");
    } finally {
      setFitmentLoading(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-zinc-500">{error}</p>
        <Link href="/marketplace" className="mt-4 inline-block text-amber-400 hover:underline">
          Back to Exchange
        </Link>
      </div>
    );
  }

  if (!listing) {
    return <div className="px-4 py-16 text-center text-zinc-500">Loading listing…</div>;
  }

  const images = listing.images.length > 0 ? listing.images : [listing.image];
  const hasPriceDrop =
    !listing.soldAt && listing.originalPrice != null && listing.originalPrice > listing.price;
  const isSold = Boolean(listing.soldAt);
  const fitCount = fitment ? fitment.matches.filter((m) => m.matched).length : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <article>
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/40">
          <ImageCarousel images={images} alt={listing.title} />
          {isSold ? (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60">
              <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold tracking-wide text-white">
                Sold
              </span>
            </div>
          ) : null}
          <div className="absolute left-3 top-3 flex gap-1">
            <Badge variant="accent">{getCategoryLabel(listing.category)}</Badge>
            {hasPriceDrop ? <Badge variant="outline">Price drop</Badge> : null}
          </div>
          {listing.tradeAccepted && !isSold ? (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-zinc-950/80 px-2.5 py-1 text-xs text-amber-400">
              <ArrowLeftRight className="h-3 w-3" />
              Trade OK
            </div>
          ) : null}
        </div>

        <div className="space-y-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{listing.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {listing.location}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              {hasPriceDrop ? (
                <span className="text-sm text-zinc-500 line-through">{formatPrice(listing.originalPrice!)}</span>
              ) : null}
              <span className="text-2xl font-bold text-amber-400">{formatPrice(listing.price)}</span>
              <ListingOwnerActions
                listing={{ ...listing, sellerId: listing.sellerId }}
                onUpdated={() => {
                  void reloadListing().catch(() => {});
                }}
                onDeleted={() => router.push("/marketplace")}
              />
            </div>
          </div>

          {comps ? (
            <p className="text-sm text-zinc-400">
              <span className="font-medium text-amber-400/90">Sold comps: </span>
              {formatPrice(comps.min)}–{formatPrice(comps.max)} · {comps.count} sold
            </p>
          ) : null}

          <p className="text-sm leading-relaxed text-zinc-300">{listing.description}</p>

          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-full bg-zinc-900/60 px-3 py-1 capitalize ring-1 ring-zinc-800/80">
              {listing.condition.replace("-", " ")}
            </span>
            <span className="rounded-full bg-zinc-900/60 px-3 py-1 ring-1 ring-zinc-800/80">
              Listed {new Date(listing.createdAt).toLocaleDateString()}
            </span>
            {listing.sellerVerified ? (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-400 ring-1 ring-amber-500/35">
                Verified seller
              </span>
            ) : null}
          </div>

          {listing.fitmentTags && listing.fitmentTags.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {listing.fitmentTags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              {!isSold ? (
                <div>
                  <button
                    type="button"
                    onClick={checkFitment}
                    disabled={fitmentLoading}
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/35 transition hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    {fitmentLoading ? "Checking…" : "Check fitment"}
                  </button>
                  {fitmentError ? <p className="mt-2 text-sm text-red-400">{fitmentError}</p> : null}
                  {fitment ? (
                    <div className="mt-2 space-y-2">
                      {fitment.matches.length > 0 ? (
                        <p className="text-sm font-medium text-emerald-400/90">
                          Fits {fitCount} of {fitment.matches.length} of your vehicles
                        </p>
                      ) : null}
                      <ul className="space-y-1 text-sm">
                        {fitment.matches.length === 0 ? (
                          <li className="space-y-2 text-zinc-500">
                            <span className="flex items-center gap-2">
                              <X className="h-4 w-4 shrink-0 text-red-400" />
                              No vehicles in your garage to compare
                            </span>
                            <Link
                              href="/garage"
                              className="ml-6 inline-flex text-sm font-medium text-amber-400 hover:text-amber-300"
                            >
              Add a vehicle to check fitment →
                            </Link>
                          </li>
                        ) : (
                          fitment.matches.map((m) => (
                            <li key={m.vehicleId} className="flex items-center gap-2 text-zinc-300">
                              {m.matched ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <X className="h-4 w-4 text-red-400" />
                              )}
                              {m.matched ? "Fits" : "No match for"} your {m.label}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <Link
            href={`/profile/${listing.seller.username}`}
            className="flex items-center gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3 transition hover:border-zinc-700/80"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.seller.avatar} alt="" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="flex flex-wrap items-center gap-2 font-medium text-white">
                {listing.seller.displayName}
                {listing.seller.verifiedSeller || listing.sellerVerified ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/35">
                    Verified
                  </span>
                ) : null}
                {listing.seller.isVerifiedShop || listing.sellerVerifiedShop ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/35">
                    Shop
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-zinc-500">@{listing.seller.username}</p>
            </div>
          </Link>

          {!isSold ? (
            <>
              <EscrowPanel
                listingId={listing.id}
                price={listing.price}
                sellerId={listing.sellerId}
                currentUserId={user?.id}
              />

              <div className="flex flex-wrap gap-2 border-t border-zinc-800/70 pt-4">
                {listing.tradeAccepted && user && user.id !== listing.sellerId ? (
                  <button
                    type="button"
                    onClick={() => setTradeOpen(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-amber-400 ring-1 ring-amber-500/35 transition hover:bg-amber-500/10"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Trade offer
                  </button>
                ) : null}
                {user?.id !== listing.sellerId ? (
                  <ListingMessageButton
                    userId={listing.seller.id}
                    username={listing.seller.username}
                    listingId={listing.id}
                    listingTitle={listing.title}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message seller
                  </ListingMessageButton>
                ) : null}
                <BookmarkButton
                  targetType="listing"
                  targetId={listing.id}
                  initialSaved={listing.bookmarked}
                  className="flex items-center justify-center rounded-full px-4 py-3 text-zinc-400 ring-1 ring-zinc-800/80 transition hover:text-amber-400"
                />
                <ShareButton
                  title={listing.title}
                  text={`Check out ${listing.title} on GearNet Exchange`}
                  path={`/marketplace/${listing.id}`}
                  iconOnly
                  className="flex items-center justify-center rounded-full px-4 py-3 text-zinc-400 ring-1 ring-zinc-800/80 transition hover:text-amber-400"
                />
                {user && user.id !== listing.sellerId ? (
                  <ListingReportButton listingId={listing.id} className="w-full" />
                ) : null}
              </div>
            </>
          ) : (
            <p className="border-t border-zinc-800/70 pt-4 text-center text-sm text-zinc-500">
              This listing has sold — archive view only.
            </p>
          )}
        </div>
      </article>
      <SimilarListingsStrip similarTo={listing.id} />
      <TradeOfferModal listingId={listing.id} open={tradeOpen} onClose={() => setTradeOpen(false)} />
    </div>
  );
}
