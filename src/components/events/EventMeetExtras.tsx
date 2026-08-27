"use client";

import { MapPin, Users } from "lucide-react";

type EventMeetExtrasProps = {
  event: {
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    rsvpCount?: number;
    attendees?: Array<{ id: string }>;
  };
};

export function EventMeetExtras({ event }: EventMeetExtrasProps) {
  const rsvps = event.rsvpCount ?? event.attendees?.length ?? 0;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
      {event.location ? (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {event.location}
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <Users className="h-3 w-3" />
        {rsvps} going
      </span>
    </div>
  );
}
