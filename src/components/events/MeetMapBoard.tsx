"use client";

import type { Event } from "@/lib/types";
import type { MapMarker, MeetPin } from "@/lib/map-types";
import { Crosshair, MapPin, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

const MeetMapInner = dynamic(() => import("./MeetMapInner"), {
  ssr: false,
  loading: () => <div className="flex h-80 items-center justify-center rounded-xl bg-zinc-900 text-sm text-zinc-500">Loading map...</div>,
});

type Props = {
  events: Event[];
  pins: MeetPin[];
  onPinAdded?: () => void;
};

type GeocodeResult = { lat: string; lon: string; display_name: string };

export function MeetMapBoard({ events, pins, onPinAdded }: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [pinTitle, setPinTitle] = useState("");
  const [pending, setPending] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]);

  const markers: MapMarker[] = useMemo(() => {
    const eventMarkers = events
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        id: `event-${e.id}`,
        title: e.title,
        description: e.description,
        latitude: e.latitude!,
        longitude: e.longitude!,
        type: "event" as const,
        subtitle: `${e.city} · ${e.date}`,
      }));
    const pinMarkers = pins.map((p) => ({
      id: `pin-${p.id}`,
      title: p.title,
      description: p.description,
      latitude: p.latitude,
      longitude: p.longitude,
      type: "pin" as const,
      subtitle: p.address || "Community pin",
    }));
    return [...eventMarkers, ...pinMarkers];
  }, [events, pins]);

  const geocode = useCallback(async (query: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = (await res.json()) as GeocodeResult[];
    if (!data[0]) throw new Error("Location not found");
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setError("");
    setLoading(true);
    try {
      const result = await geocode(search);
      setMapCenter([result.lat, result.lng]);
      setPending({ lat: result.lat, lng: result.lng, address: result.address });
    } catch {
      setError("Could not find that location");
    } finally {
      setLoading(false);
    }
  }

  function handleGps() {
    if (!navigator.geolocation) {
      setError("GPS not available on this device");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
        setPending({ lat, lng });
        setLoading(false);
      },
      () => {
        setError("Could not get your location");
        setLoading(false);
      }
    );
  }

  function handleMapClick(lat: number, lng: number) {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/events";
      return;
    }
    setPending({ lat, lng });
  }

  async function savePin() {
    if (!pending || !pinTitle.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/meet-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pinTitle.trim(),
          latitude: pending.lat,
          longitude: pending.lng,
          address: pending.address ?? search,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save pin");
      setPinTitle("");
      setPending(null);
      setSearch("");
      onPinAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save pin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="font-semibold text-white">Meet Map</h2>
        <p className="text-xs text-zinc-500">Drop pins with GPS, search a spot, or tap the map</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 p-3">
        <form onSubmit={handleSearch} className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address or place..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
          />
        </form>
        <button
          type="button"
          onClick={handleGps}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-amber-500/50 hover:text-amber-400"
        >
          <Crosshair className="h-4 w-4" />
          Use GPS
        </button>
      </div>

      <div className="h-80 [&_.leaflet-container]:z-0">
        <MeetMapInner markers={markers} center={mapCenter} zoom={markers.length ? 6 : 4} onMapClick={handleMapClick} />
      </div>

      {pending ? (
        <div className="space-y-3 border-t border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Pin at {pending.lat.toFixed(4)}, {pending.lng.toFixed(4)}
            {pending.address ? ` · ${pending.address.slice(0, 60)}` : ""}
          </p>
          <input
            value={pinTitle}
            onChange={(e) => setPinTitle(e.target.value)}
            placeholder="Pin name (e.g. Friday Night Meet)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={savePin}
              disabled={loading || !pinTitle.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <MapPin className="h-4 w-4" />
              Drop Pin
            </button>
            <button type="button" onClick={() => setPending(null)} className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="px-4 pb-3 text-sm text-red-400">{error}</p> : null}

      <div className="flex gap-4 border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-600">
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm border border-amber-500 bg-white" /> Event</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Community pin</span>
      </div>
    </section>
  );
}
