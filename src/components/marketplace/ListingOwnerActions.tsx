"use client";

import { CreateListingModal } from "@/components/forms/CreateListingModal";
import { OwnerMenu } from "@/components/ui/OwnerMenu";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Listing = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  tradeAccepted: boolean;
  image: string;
  images?: string[];
};

export function ListingOwnerActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm("Delete this listing? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/marketplace/${listing.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : [listing.image];

  return (
    <>
      <OwnerMenu ownerId={listing.sellerId} onEdit={() => setEditOpen(true)} onDelete={handleDelete} label="Listing options" />
      <CreateListingModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          condition: listing.condition,
          location: listing.location,
          tradeAccepted: listing.tradeAccepted,
          images,
        }}
      />
    </>
  );
}
