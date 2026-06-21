import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { RsvpButton } from "@/components/events/RsvpButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { Calendar, MapPin, Users } from "lucide-react";
import Image from "next/image";

type EventData = {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  date: string;
  time: string;
  organizerId: string;
  attendeeCount: number;
  maxAttendees?: number | null;
  tags: string[];
  image: string;
  organizer?: { id: string; username: string; displayName: string; avatar: string };
};

export function EventCard({ event }: { event: EventData }) {
  const organizer = event.organizer;

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="relative aspect-[2/1] bg-zinc-800">
        <Image src={event.image} alt={event.title} fill className="object-cover" sizes="600px" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-lg font-bold text-white">{event.title}</h3>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm text-zinc-400">{event.description}</p>
        <div className="space-y-2 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-amber-500" />
            {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {event.time}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
            {event.location}, {event.city}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-amber-500" />
            {event.attendeeCount} attending
            {event.maxAttendees && ` · ${event.maxAttendees - event.attendeeCount} spots left`}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <Badge key={tag} variant="accent">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
          {organizer && (
            <div className="flex items-center gap-2">
              <Avatar src={organizer.avatar} alt={organizer.displayName} size="sm" />
              <span className="text-xs text-zinc-500">Hosted by {organizer.displayName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <ShareButton
              title={event.title}
              text={`${event.title} — ${event.location}, ${event.city}`}
              path="/events"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
            />
            <RsvpButton eventId={event.id} />
          </div>
        </div>
      </div>
    </article>
  );
}
