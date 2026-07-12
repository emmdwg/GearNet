"use client";

import { ManualCard } from "@/components/bench/MaintenanceEntry";
import {
  withResolvedManualsClient,
} from "@/lib/manual-catalog/normalize-client";
import type { ManualGuideNote, ServiceManual, Vehicle } from "@/lib/types";
import { Loader2, Search, ThumbsUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Suggestion = {
  id: string;
  label: string;
  subtitle: string;
  query: string;
};

type SearchResponse = {
  suggestions: Suggestion[];
  results: ServiceManual[];
  total: number;
};

function withResolvedManuals(manuals: ServiceManual[]) {
  return withResolvedManualsClient(manuals);
}

export function ManualLibrary({
  initialManuals,
  totalCount,
  vehicleCount,
  fleetVehicles = [],
}: {
  initialManuals?: ServiceManual[];
  totalCount?: number;
  vehicleCount?: number;
  fleetVehicles?: Pick<Vehicle, "year" | "make" | "model">[];
}) {
  const safeInitial = useMemo(
    () => withResolvedManuals(initialManuals ?? []),
    [initialManuals],
  );
  const safeTotalCount = totalCount ?? 0;
  const safeVehicleCount = vehicleCount ?? 0;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [results, setResults] = useState(safeInitial);
  const [total, setTotal] = useState(safeTotalCount);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tips, setTips] = useState<ManualGuideNote[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipSection, setTipSection] = useState("");
  const [tipText, setTipText] = useState("");
  const [tipError, setTipError] = useState("");
  const [tipSaving, setTipSaving] = useState(false);

  const tipsVehicle = useMemo(() => {
    if (results.length > 0) {
      return { make: results[0].vehicleMake, model: results[0].vehicleModel };
    }
    if (fleetVehicles.length > 0) {
      return { make: fleetVehicles[0].make, model: fleetVehicles[0].model };
    }
    return null;
  }, [results, fleetVehicles]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const runSearch = useCallback(async (q: string) => {
    if (!q) {
      setResults(safeInitial);
      setTotal(safeTotalCount);
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "100", suggestions: "8" });
      const res = await fetch(`/api/manuals/search?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as SearchResponse;
      setResults(withResolvedManuals(Array.isArray(data.results) ? data.results : []));
      setTotal(typeof data.total === "number" ? data.total : 0);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setResults([]);
      setTotal(0);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [safeInitial, safeTotalCount]);

  const loadMore = useCallback(async () => {
    if (debouncedQuery || loadingMore || results.length >= total) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        type: "manuals",
        limit: "48",
        offset: String(results.length),
      });
      const res = await fetch(`/api/maintenance?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("load more failed");
      const data = await res.json();
      const next = withResolvedManuals(Array.isArray(data.results) ? data.results : []);
      setResults((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...next.filter((m) => !seen.has(m.id))];
      });
      if (typeof data.total === "number") setTotal(data.total);
      else if (typeof data.vehicleTotal === "number") setTotal(data.vehicleTotal);
    } catch {
      /* keep current results */
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedQuery, loadingMore, results.length, total]);

  useEffect(() => {
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(safeInitial);
      setTotal(safeTotalCount);
    }
  }, [safeInitial, safeTotalCount, debouncedQuery]);

  useEffect(() => {
    if (!tipsVehicle) {
      setTips([]);
      return;
    }
    setTipsLoading(true);
    const params = new URLSearchParams({ make: tipsVehicle.make, model: tipsVehicle.model });
    fetch(`/api/manuals/notes?${params}`)
      .then((r) => (r.ok ? r.json() : { notes: [] }))
      .then((data) => setTips(Array.isArray(data.notes) ? data.notes : []))
      .catch(() => setTips([]))
      .finally(() => setTipsLoading(false));
  }, [tipsVehicle?.make, tipsVehicle?.model]);

  async function submitTip(e: React.FormEvent) {
    e.preventDefault();
    if (!tipsVehicle || !tipSection.trim() || !tipText.trim()) return;
    setTipSaving(true);
    setTipError("");
    try {
      const res = await fetch("/api/manuals/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleMake: tipsVehicle.make,
          vehicleModel: tipsVehicle.model,
          section: tipSection.trim(),
          tip: tipText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add tip");
      setTips((prev) => [data, ...prev]);
      setTipSection("");
      setTipText("");
    } catch (err) {
      setTipError(err instanceof Error ? err.message : "Failed to add tip");
    } finally {
      setTipSaving(false);
    }
  }

  async function upvoteTip(id: string) {
    const res = await fetch(`/api/manuals/notes/${id}/upvote`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setTips((prev) => prev.map((t) => (t.id === id ? { ...t, upvotes: data.upvotes } : t)));
  }

  function applySuggestion(suggestion: Suggestion) {
    setQuery(suggestion.query);
    setDebouncedQuery(suggestion.query);
    setFocused(false);
    setSuggestions([]);
  }

  const showSuggestions = focused && suggestions.length > 0 && query.trim().length > 0;

  return (
    <section className="mt-6">
      <h2 className="mb-1 text-lg font-semibold text-white">Reference Manuals</h2>
      <p className="mb-3 text-[13px] text-zinc-500">
        {safeVehicleCount > 0
          ? `${safeVehicleCount.toLocaleString()} vehicles indexed · ${safeTotalCount.toLocaleString()} verified service manual generations`
          : `${safeTotalCount.toLocaleString()} verified service manual generations`}
      </p>

      <div className="mb-2 flex items-center rounded-xl border border-zinc-800 bg-zinc-900/50 px-3">
        <Search className="mr-2 h-[18px] w-[18px] shrink-0 text-zinc-500" />
        <input
          type="search"
          autoComplete="off"
          placeholder="Search year, make, model — e.g. 2015 Ford F-150"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setSuggestions([]);
            }}
            className="shrink-0 text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        ) : null}
      </div>

      {showSuggestions ? (
        <div className="mb-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applySuggestion(item)}
              className="flex w-full flex-col items-start border-b border-zinc-800 px-3 py-2.5 text-left last:border-b-0 hover:bg-zinc-800/50"
            >
              <span className="text-sm font-medium text-white">{item.label}</span>
              <span className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{item.subtitle}</span>
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="my-3 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        </div>
      ) : null}

      {!loading && debouncedQuery && results.length === 0 ? (
        <p className="mb-3 text-sm text-zinc-500">
          No verified manuals matched &ldquo;{debouncedQuery}&rdquo;. Try a different year, make, or model.
        </p>
      ) : null}

      {!loading && !debouncedQuery ? (
        safeInitial.length > 0 ? (
          <p className="mb-3 text-[13px] leading-relaxed text-zinc-500">
            Showing verified manuals with direct links — search by year, make, and model. Same manual across
            multiple years is grouped into one generation.
          </p>
        ) : (
          <p className="mb-3 text-[13px] leading-relaxed text-zinc-500">
            No verified manuals in the catalog yet. Search by year, make, and model as more links are resolved.
          </p>
        )
      ) : null}

      {(results ?? []).map((manual) => (
        <ManualCard key={manual.id} manual={manual} />
      ))}

      {total > results.length ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-center text-xs text-zinc-500">
            Showing {results.length} of {total.toLocaleString()} matches
          </p>
          {!debouncedQuery ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-zinc-800 disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more manuals"}
            </button>
          ) : null}
        </div>
      ) : null}

      {tipsVehicle ? (
        <div className="mt-8 border-t border-zinc-800 pt-6">
          <h3 className="mb-1 text-base font-semibold text-white">Community tips</h3>
          <p className="mb-3 text-xs text-zinc-500">
            {tipsVehicle.make} {tipsVehicle.model} — share what worked in the shop
          </p>
          {tipsLoading ? (
            <div className="my-3 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            </div>
          ) : tips.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {tips.map((note) => (
                <li key={note.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-amber-400">{note.section}</p>
                      <p className="mt-1 text-sm text-zinc-300">{note.tip}</p>
                      <p className="mt-1 text-[10px] text-zinc-600">@{note.user.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => upvoteTip(note.id)}
                      className="flex shrink-0 items-center gap-1 text-xs text-zinc-500 hover:text-amber-400"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {note.upvotes}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-zinc-500">No community tips yet — be the first.</p>
          )}
          <form onSubmit={submitTip} className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            {tipError ? <p className="text-xs text-red-400">{tipError}</p> : null}
            <input
              value={tipSection}
              onChange={(e) => setTipSection(e.target.value)}
              placeholder="Section (e.g. Oil change, Brakes)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
            <textarea
              value={tipText}
              onChange={(e) => setTipText(e.target.value)}
              placeholder="Your tip..."
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={tipSaving || !tipSection.trim() || !tipText.trim()}
              className="w-full rounded-lg bg-amber-500/90 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {tipSaving ? "Posting..." : "Add tip"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
