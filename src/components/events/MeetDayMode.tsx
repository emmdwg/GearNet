"use client";

import { MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";

type MeetDayModeProps = {
  event: {
    id: string;
    title: string;
    location?: string | null;
    date?: string | Date | null;
    attendees?: Array<{ id: string; username?: string | null; name?: string | null }>;
  };
  onClose?: () => void;
};

export function MeetDayMode({ event, onClose }: MeetDayModeProps) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Meet day</p>
          <h2 className="text-lg font-bold text-zinc-100">{event.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => (onClose ? onClose() : router.back())}
          className="rounded-full p-2 text-zinc-400 hover:bg-zinc-900"
          aria-label="Close meet day"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {event.location ? (
          <p className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400">
            <MapPin className="h-4 w-4 text-amber-500" />
            {event.location}
          </p>
        ) : null}
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Checked in</h3>
        <ul className="space-y-2">
          {(event.attendees ?? []).map((person) => (
            <li key={person.id} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
              {person.name || person.username || "Member"}
            </li>
          ))}
          {(event.attendees ?? []).length === 0 ? (
            <li className="text-sm text-zinc-500">No RSVPs yet. People who tap Going will show here.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
