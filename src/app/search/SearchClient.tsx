"use client";

import { Avatar } from "@/components/ui/Avatar";
import { TrendingTags } from "@/components/tags/TrendingTags";
import { Car, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SearchUser = { id: string; username: string; displayName: string; avatar: string; bio?: string };
type SearchPost = { id: string; image: string; caption: string; likes: number; comments: number };
type SearchVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  image: string;
  owner?: { username: string; displayName: string };
};
type SearchListing = {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  location: string;
};

type Results = {
  users: SearchUser[];
  posts: SearchPost[];
  vehicles: SearchVehicle[];
  listings: SearchListing[];
};

const EMPTY: Results = { users: [], posts: [], vehicles: [], listings: [] };
const TABS = ["All", "People", "Vehicles", "Posts", "Market"] as const;
type Tab = (typeof TABS)[number];

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("All");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.replace(`/search${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }, [query, router]);

  const total =
    results.users.length + results.vehicles.length + results.posts.length + results.listings.length;
  const showPeople = tab === "All" || tab === "People";
  const showVehicles = tab === "All" || tab === "Vehicles";
  const showPosts = tab === "All" || tab === "Posts";
  const showMarket = tab === "All" || tab === "Market";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, vehicles, builds, parts..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-amber-500 text-zinc-950" : "border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!query.trim() ? (
        <div className="space-y-6 py-8">
          <TrendingTags compact />
          <p className="text-center text-sm text-zinc-500">
            Search GearNet for builders, vehicles, posts, and marketplace listings.
          </p>
        </div>
      ) : loading ? (
        <p className="py-16 text-center text-sm text-zinc-500">Searching...</p>
      ) : total === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">No results for “{query.trim()}”.</p>
      ) : (
        <div className="space-y-8">
          {showPeople && results.users.length > 0 && (
            <Section title="People">
              <div className="space-y-2">
                {results.users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-700"
                  >
                    <Avatar src={u.avatar} alt={u.displayName} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{u.displayName}</p>
                      <p className="truncate text-xs text-zinc-500">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {showVehicles && results.vehicles.length > 0 && (
            <Section title="Vehicles">
              <div className="grid gap-3 sm:grid-cols-2">
                {results.vehicles.map((v) => (
                  <Link
                    key={v.id}
                    href={v.owner ? `/garage/${v.owner.username}` : "/explore"}
                    className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition-colors hover:border-zinc-700"
                  >
                    <div className="relative aspect-[16/10] bg-zinc-800">
                      <Image src={v.image} alt={`${v.make} ${v.model}`} fill sizes="320px" className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="flex items-center gap-1.5 font-semibold text-white">
                        <Car className="h-4 w-4 text-amber-400" />
                        {v.year} {v.make} {v.model}
                      </p>
                      {v.owner && <p className="mt-0.5 text-xs text-zinc-500">@{v.owner.username}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {showPosts && results.posts.length > 0 && (
            <Section title="Posts">
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {results.posts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/explore?post=${p.id}`}
                    className="relative aspect-square overflow-hidden bg-zinc-900"
                  >
                    <Image src={p.image} alt={p.caption} fill sizes="220px" className="object-cover" />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {showMarket && results.listings.length > 0 && (
            <Section title="Marketplace">
              <div className="space-y-2">
                {results.listings.map((l) => (
                  <Link
                    key={l.id}
                    href={`/marketplace/${l.id}`}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 transition-colors hover:border-zinc-700"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      <Image src={l.image} alt={l.title} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{l.title}</p>
                      <p className="text-xs text-zinc-500">
                        {l.location} · {l.category}
                      </p>
                    </div>
                    <p className="flex items-center gap-1 font-bold text-amber-400">
                      <ShoppingBag className="h-3.5 w-3.5" />${l.price.toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}
