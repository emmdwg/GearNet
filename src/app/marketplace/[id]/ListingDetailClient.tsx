"use client";

import { ListingOwnerActions } from "@/components/marketplace/ListingOwnerActions";
import { MessageUserButton } from "@/components/chat/MessageUserButton";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, ArrowLeftRight, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ListingDetail = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  image: string;
  images: string[];
  location: string;
  createdAt: string;
  tradeAccepted: boolean;
  bookmarked: boolean;
  seller: { id: string; username: string; displayName: string; avatar: string };
};

export function ListingDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/marketplace/${id}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Not found");
        setListing(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

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
    return <div className="px-4 py-16 text-center text-zinc-500">Loading listing...</div>;
  }

  const images = listing.images.length > 0 ? listing.images : [listing.image];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="relative">
          <ImageCarousel images={images} alt={listing.title} />
          <div className="absolute left-3 top-3">
            <Badge variant="accent">{listing.category}</Badge>
          </div>
          {listing.tradeAccepted && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-zinc-950/80 px-2 py-1 text-xs text-amber-400">
              <ArrowLeftRight className="h-3 w-3" />
              Trade OK
            </div>
          )}
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{listing.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
                <MapPin className="h-3.5 w-3.5" />
                {listing.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-400">{formatPrice(listing.price)}</span>
              <ListingOwnerActions listing={{ ...listing, sellerId: listing.sellerId }} />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-zinc-300">{listing.description}</p>

          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-800 px-3 py-1 capitalize">
              {listing.condition.replace("-", " ")}
            </span>
            <span className="rounded-full border border-zinc-800 px-3 py-1">
              Listed {new Date(listing.createdAt).toLocaleDateString()}
            </span>
          </div>

          <Link
            href={`/profile/${listing.seller.username}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 transition-colors hover:border-zinc-700"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.seller.avatar} alt="" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-medium text-white">{listing.seller.displayName}</p>
              <p className="text-xs text-zinc-500">@{listing.seller.username}</p>
            </div>
          </Link>

          <div className="flex gap-2 border-t border-zinc-800 pt-4">
            <MessageUserButton
              userId={listing.seller.id}
              username={listing.seller.username}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
            >
              <MessageCircle className="h-4 w-4" />
              Message Seller
            </MessageUserButton>
            <BookmarkButton
              targetType="listing"
              targetId={listing.id}
              initialSaved={listing.bookmarked}
              className="flex items-center justify-center rounded-xl border border-zinc-700 px-4 py-3 text-zinc-400 hover:border-zinc-600 hover:text-amber-400"
            />
          </div>
        </div>
      </article>
    </div>
  );
}
