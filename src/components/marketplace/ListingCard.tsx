import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { MessageUserButton } from "@/components/chat/MessageUserButton";
import { ListingOwnerActions } from "@/components/marketplace/ListingOwnerActions";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { ArrowLeftRight, MessageCircle } from "lucide-react";
import Link from "next/link";

type ListingData = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  image: string;
  images?: string[];
  location: string;
  tradeAccepted: boolean;
  seller?: { id: string; username: string };
};

export function ListingCard({ listing }: { listing: ListingData }) {
  const images = listing.images && listing.images.length > 0 ? listing.images : [listing.image];

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700">
      <Link href={`/marketplace/${listing.id}`} className="relative block">
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
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/marketplace/${listing.id}`} className="min-w-0 flex-1">
            <h3 className="font-semibold text-white hover:text-amber-400">{listing.title}</h3>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-lg font-bold text-amber-400">{formatPrice(listing.price)}</span>
            <ListingOwnerActions listing={{ ...listing, sellerId: listing.seller?.id ?? listing.sellerId }} />
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-zinc-400">{listing.description}</p>
        <div className="flex items-center justify-between pt-1 text-xs text-zinc-500">
          <span>{listing.location}</span>
          <span className="capitalize">{listing.condition.replace("-", " ")}</span>
        </div>
        {listing.seller && (
          <p className="pt-1 text-xs text-zinc-600">Listed by @{listing.seller.username}</p>
        )}
        <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
          {listing.seller && (
            <MessageUserButton
              userId={listing.seller.id ?? listing.sellerId}
              username={listing.seller.username}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
            >
              <MessageCircle className="h-4 w-4" />
              Message Seller
            </MessageUserButton>
          )}
          <BookmarkButton
            targetType="listing"
            targetId={listing.id}
            className="flex items-center justify-center rounded-lg border border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-amber-400"
          />
        </div>
      </div>
    </article>
  );
}
