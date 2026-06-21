import { EventsContent } from "@/components/events/EventsContent";
import { getEvents, getMeetPins } from "@/lib/db";

export default async function EventsPage() {
  const [events, pins] = await Promise.all([getEvents(), getMeetPins()]);
  return <EventsContent events={events} pins={pins} />;
}
