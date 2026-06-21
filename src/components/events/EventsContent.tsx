"use client";

import { CreateEventModal } from "@/components/forms/CreateEventModal";
import { EventCard } from "@/components/events/EventCard";
import { MeetMapBoard } from "@/components/events/MeetMapBoard";
import type { Event } from "@/lib/types";
import type { MeetPin } from "@/lib/map-types";
import { CalendarPlus, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = { events: Event[]; pins: MeetPin[] };

const tabs = ["All", "Meets", "Cruises", "Shows", "Expos"];

export function EventsContent({ events, pins }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("");

  const filtered = useMemo(() => {
    let result = events;
    if (activeTab !== "All") {
      const tag = activeTab.toLowerCase().replace(/s$/, "");
      result = result.filter((e) => e.tags.some((t) => t.toLowerCase().includes(tag)));
    }
    if (cityFilter.trim()) {
      result = result.filter((e) => e.city.toLowerCase().includes(cityFilter.toLowerCase()));
    }
    return result;
  }, [events, activeTab, cityFilter]);

  function handleCreate() {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/events";
      return;
    }
    setCreateOpen(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meet Board</h1>
          <p className="text-sm text-zinc-500">Find car meets, cruises, and shows near you</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
        >
          <CalendarPlus className="h-4 w-4" />
          Create Event
        </button>
      </header>

      <MeetMapBoard events={events} pins={pins} onPinAdded={() => router.refresh()} />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            showFilters ? "border-amber-500/50 text-amber-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter
        </button>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mb-6">
          <input
            type="search"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="Filter by city..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
          />
        </div>
      )}

      <div className="space-y-6">
        {filtered.length > 0 ? (
          filtered.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <p className="text-center text-sm text-zinc-500">No events match your filters.</p>
        )}
      </div>

      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
