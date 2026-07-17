"use client";

import { CreateEventModal } from "@/components/forms/CreateEventModal";
import { MeetDayMode } from "@/components/events/MeetDayMode";
import { EventMeetExtras } from "@/components/events/EventMeetExtras";
import { EventCard } from "@/components/events/EventCard";
import { MeetMapBoard } from "@/components/events/MeetMapBoard";
import { haversineKm } from "@/lib/geo";
import type { Event } from "@/lib/types";
import type { MeetPin } from "@/lib/map-types";
import { cn } from "@/lib/utils";
import { CalendarPlus, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Props = { events: Event[]; pins: MeetPin[] };

type AgendaTab = "mine" | "upcoming" | "near";

const MY_RSVP = new Set(["going", "maybe", "showing-car", "spectator"]);

function isMeetToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isClubHosted(event: Event) {
  return Boolean(event.clubId || event.club);
}

function parseAgendaParam(raw: string | null): AgendaTab | null {
  if (raw === "mine" || raw === "going" || raw === "maybe") return "mine";
  if (raw === "near") return "near";
  if (raw === "upcoming") return "upcoming";
  return null;
}

export function EventsContent({ events, pins }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [agenda, setAgenda] = useState<AgendaTab>("upcoming");
  const [showPast, setShowPast] = useState(false);
  const [clubHostedOnly, setClubHostedOnly] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = parseAgendaParam(searchParams.get("agenda") ?? searchParams.get("tab"));
    if (fromQuery) {
      setAgenda(fromQuery);
      setShowPast(false);
    }
    if (searchParams.get("agenda") === "past" || searchParams.get("tab") === "past") {
      setShowPast(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const focusId = searchParams.get("event");
    if (focusId && events.some((e) => e.id === focusId)) {
      const focused = events.find((e) => e.id === focusId);
      if (focused && new Date(focused.date) < startOfToday()) setShowPast(true);
      if (focused?.viewerRsvpStatus && MY_RSVP.has(focused.viewerRsvpStatus)) {
        setAgenda("mine");
        setShowPast(false);
      }
      setExpandedEventId(focusId);
      requestAnimationFrame(() => {
        document.getElementById(`event-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams, events]);

  useEffect(() => {
    if (!user || agenda !== "near" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoDenied(false);
      },
      () => {
        setGeoDenied(true);
        const home = user?.location?.trim();
        if (home) setCityFilter((prev) => prev || home);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [agenda, user, user?.location]);

  const filtered = useMemo(() => {
    const today = startOfToday();
    const includePast = Boolean(user && showPast);
    let result = includePast
      ? events.filter((e) => new Date(e.date) < today)
      : events.filter((e) => new Date(e.date) >= today);

    if (!user) return result;

    if (agenda === "mine") {
      result = result.filter((e) => e.viewerRsvpStatus && MY_RSVP.has(e.viewerRsvpStatus));
    }
    if (cityFilter.trim()) {
      const q = cityFilter.trim().toLowerCase();
      result = result.filter(
        (e) => e.city.toLowerCase().includes(q) || e.location.toLowerCase().includes(q),
      );
    }
    if (clubHostedOnly) {
      result = result.filter(isClubHosted);
    }
    if (agenda === "near" && userLocation && !showPast) {
      result = [...result].sort((a, b) => {
        const aDist =
          a.latitude != null && a.longitude != null
            ? haversineKm(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
            : Number.POSITIVE_INFINITY;
        const bDist =
          b.latitude != null && b.longitude != null
            ? haversineKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
            : Number.POSITIVE_INFINITY;
        return aDist - bDist;
      });
    } else if (showPast) {
      result = [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return result;
  }, [events, agenda, cityFilter, clubHostedOnly, userLocation, user, showPast]);

  const filtersActive = Boolean(user && (cityFilter.trim() || clubHostedOnly || showPast));

  function handleCreate() {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/events";
      return;
    }
    setCreateOpen(true);
  }

  function setAgendaTab(next: AgendaTab) {
    setShowPast(false);
    setAgenda(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "upcoming") params.delete("agenda");
    else params.set("agenda", next);
    const qs = params.toString();
    router.replace(qs ? `/events?${qs}` : "/events", { scroll: false });
  }

  const agendaLabel = showPast
    ? "Past"
    : agenda === "mine"
      ? "Going / Maybe"
      : agenda === "near"
        ? "Near you"
        : "Upcoming";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Meets</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Car meets, cruises, and shows near you</p>
      </header>

      <button
        type="button"
        onClick={handleCreate}
        className="mb-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        Create meet
      </button>

      {user ? (
        <MeetMapBoard
          events={events}
          pins={pins}
          onPinAdded={() => router.refresh()}
          selectedEventId={expandedEventId}
          onEventSelect={(id) => setExpandedEventId(id)}
        />
      ) : (
        <p className="mb-4 text-xs text-zinc-500">Sign in to use the map, Near you, and city filters.</p>
      )}

      {user ? (
        <>
          <div className="mb-3 flex gap-1 overflow-x-auto rounded-full bg-zinc-900/70 p-1 ring-1 ring-zinc-800/70 scrollbar-hide">
            {(
              [
                ["mine", "Going / Maybe"],
                ["upcoming", "Upcoming"],
                ["near", "Near you"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAgendaTab(id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                  !showPast && agenda === id
                    ? "bg-amber-500 text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {agenda === "near" && !showPast && geoDenied && !userLocation ? (
            <p className="mb-3 text-xs text-zinc-500">
              Location unavailable
              {user.location ? ` — filtering by your home area (${user.location}).` : ". Set a home area in Settings."}
            </p>
          ) : null}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filter by city…"
              className="min-w-0 flex-1 rounded-full border border-zinc-800/80 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/60 focus:outline-none"
            />
            {user.location ? (
              <button
                type="button"
                onClick={() => setCityFilter(user.location?.trim() ?? "")}
                className="shrink-0 rounded-full bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30"
              >
                Use home
              </button>
            ) : (
              <Link
                href="/settings"
                className="shrink-0 rounded-full bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 ring-1 ring-zinc-700"
              >
                Set home area
              </Link>
            )}
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setClubHostedOnly((v) => !v)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                clubHostedOnly
                  ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/35"
                  : "bg-zinc-900/60 text-zinc-500 ring-1 ring-zinc-800/80 hover:text-zinc-300",
              )}
            >
              Hosted by clubs
            </button>
            <button
              type="button"
              onClick={() => setShowPast((v) => !v)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                showPast
                  ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/35"
                  : "bg-zinc-900/60 text-zinc-500 ring-1 ring-zinc-800/80 hover:text-zinc-300",
              )}
            >
              Past meets
            </button>
          </div>
        </>
      ) : null}

      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">{agendaLabel}</h2>
          <p className="text-xs text-zinc-500">
            {!user
              ? "Browse upcoming meets — sign in for RSVP and Near you"
              : showPast
                ? "Earlier meets"
                : agenda === "mine"
                  ? "Meets you’ve RSVP’d to"
                  : agenda === "near"
                    ? "Sorted by distance when location is available"
                    : "Tap a meet for details, RSVP, and join options"}
          </p>
        </div>
        {filtered.length > 0 ? (
          <span className="text-[11px] tabular-nums text-zinc-600">{filtered.length}</span>
        ) : null}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-12 text-center">
            <p className="text-base font-semibold text-white">
              {filtersActive
                ? "No meets match"
                : agenda === "mine"
                  ? "No RSVPs yet"
                  : showPast
                    ? "No past meets"
                    : "No upcoming meets"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              {filtersActive
                ? "Try another city or clear filters."
                : agenda === "mine"
                  ? "RSVP Going or Maybe on an upcoming meet to pin it here."
                  : showPast
                    ? "Past meets will show up here after they’ve happened."
                    : "Be the first to post a meet, cruise, or show in your area."}
            </p>
            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setCityFilter("");
                  setClubHostedOnly(false);
                  setShowPast(false);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                Clear filters
              </button>
            ) : agenda === "mine" ? (
              <button
                type="button"
                onClick={() => setAgendaTab("upcoming")}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                Browse upcoming
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                <CalendarPlus className="h-4 w-4" />
                Create a meet
              </button>
            )}
          </div>
        ) : (
          filtered.map((event) => (
            <div key={event.id} id={`event-${event.id}`} className="space-y-0 scroll-mt-24">
              <EventCard
                event={event}
                onMeetDay={
                  isMeetToday(event.date)
                    ? () => setExpandedEventId(expandedEventId === event.id ? null : event.id)
                    : undefined
                }
                meetDayExpanded={expandedEventId === event.id && isMeetToday(event.date)}
                onSelect={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
              />
              {expandedEventId === event.id ? (
                isMeetToday(event.date) ? (
                  <MeetDayMode event={event} />
                ) : (
                  <EventMeetExtras event={event} />
                )
              ) : null}
            </div>
          ))
        )}
      </div>

      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
