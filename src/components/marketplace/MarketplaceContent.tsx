"use client";

import { CreateListingModal } from "@/components/forms/CreateListingModal";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/types";
import { Filter, Plus, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMemo, useState } from "react";

type Props = { listings: MarketplaceListing[] };

const categories = ["All", "Vehicles", "Parts", "Wheels", "Accessories", "Trade"];

export function MarketplaceContent({ listings }: Props) {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = useMemo(() => {
    let result = listings;
    if (activeCategory !== "All") {
      if (activeCategory === "Trade") {
        result = result.filter((l) => l.tradeAccepted);
      } else {
        result = result.filter((l) => l.category.toLowerCase() === activeCategory.toLowerCase().replace(/s$/, ""));
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }
    if (maxPrice) {
      const max = parseInt(maxPrice, 10);
      if (!Number.isNaN(max)) result = result.filter((l) => l.price <= max);
    }
    return result;
  }, [listings, activeCategory, search, maxPrice]);

  function handleList() {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/marketplace";
      return;
    }
    setCreateOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Parts Exchange</h1>
          <p className="text-sm text-zinc-500">Buy, sell, and trade vehicles & car parts</p>
        </div>
        <button
          type="button"
          onClick={handleList}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          List Item
        </button>
      </header>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings..."
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            showFilters ? "border-amber-500/50 text-amber-400" : "border-zinc-700 text-zinc-400 hover:text-white"
          }`}
        >
          <Filter className="h-3 w-3" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="mb-6">
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price ($)"
            className="w-full max-w-xs rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length > 0 ? (
          filtered.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        ) : (
          <p className="col-span-full text-center text-sm text-zinc-500">No listings found.</p>
        )}
      </div>

      <CreateListingModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
