import { clubNotFound, findClubBySlug } from "@/lib/clubs";
import { getEvents } from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ slug: string }> };

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const session = await getSession();
  const events = await getEvents(club.id, session?.user?.id);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GearNet//Clubs//EN",
    `X-WR-CALNAME:${icsEscape(club.name)}`,
  ];

  for (const event of events) {
    const start = new Date(event.date);
    const stamp = start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const endStamp = end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@gearnetapp.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${stamp}`,
      `DTEND:${endStamp}`,
      `SUMMARY:${icsEscape(event.title)}`,
      `DESCRIPTION:${icsEscape(event.description ?? "")}`,
      `LOCATION:${icsEscape([event.location, event.city].filter(Boolean).join(", "))}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
