export const RSVP_STATUSES = ["going", "maybe", "spectator", "showing-car"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export function isRsvpStatus(value: unknown): value is RsvpStatus {
  return typeof value === "string" && (RSVP_STATUSES as readonly string[]).includes(value);
}

export function rsvpStatusLabel(status: RsvpStatus): string {
  switch (status) {
    case "going":
      return "Going";
    case "maybe":
      return "Maybe";
    case "spectator":
      return "Spectator";
    case "showing-car":
      return "Showing car";
    default:
      return "Going";
  }
}
