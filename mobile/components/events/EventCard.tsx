import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Share, StyleSheet, Text, View } from "react-native";
import type { Event } from "../../lib/types";
import { colors, radii, spacing } from "../../lib/theme";
import { formatEventDate } from "../../lib/utils";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

type Props = {
  event: Event;
  onRsvp?: (eventId: string) => void;
  rsvpLoading?: boolean;
  onSignInRequired?: () => void;
  isAuthenticated?: boolean;
};

export function EventCard({ event, onRsvp, rsvpLoading, onSignInRequired, isAuthenticated }: Props) {
  const organizer = event.organizer;

  function handleRsvp() {
    if (!isAuthenticated) {
      onSignInRequired?.();
      return;
    }
    onRsvp?.(event.id);
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `${event.title} — ${formatEventDate(event.date)} at ${event.time}, ${event.location}, ${event.city}. Join me on GearNet!`,
      });
    } catch {
      // cancelled
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: event.image }} style={styles.image} />
        <View style={styles.imageOverlay} />
        <Text style={styles.imageTitle}>{event.title}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.detail}>
          <Ionicons name="calendar-outline" size={16} color={colors.accent} />
          <Text style={styles.detailText}>
            {formatEventDate(event.date)} at {event.time}
          </Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="location-outline" size={16} color={colors.accent} />
          <Text style={styles.detailText}>
            {event.location}, {event.city}
          </Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="people-outline" size={16} color={colors.accent} />
          <Text style={styles.detailText}>
            {event.attendeeCount} attending
            {event.maxAttendees ? ` · ${event.maxAttendees - event.attendeeCount} spots left` : ""}
          </Text>
        </View>

        <View style={styles.tags}>
          {event.tags.map((tag) => (
            <Badge key={tag} variant="accent">
              {tag}
            </Badge>
          ))}
        </View>

        <View style={styles.footer}>
          {organizer ? (
            <View style={styles.host}>
              <Avatar src={organizer.avatar} alt={organizer.displayName} size="sm" />
              <Text style={styles.hostText}>Hosted by {organizer.displayName}</Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.footerActions}>
            <Pressable style={styles.shareButton} onPress={handleShare} accessibilityLabel="Share event">
              <Ionicons name="share-outline" size={18} color={colors.textDim} />
            </Pressable>
            <Pressable style={styles.rsvpButton} onPress={handleRsvp} disabled={rsvpLoading}>
              <Text style={styles.rsvpText}>{rsvpLoading ? "..." : "RSVP"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  imageWrap: {
    aspectRatio: 2,
    backgroundColor: colors.border,
    justifyContent: "flex-end",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9,9,11,0.45)",
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    padding: spacing.md,
  },
  body: {
    padding: spacing.md,
    gap: 10,
  },
  description: {
    fontSize: 14,
    color: colors.textDim,
    lineHeight: 20,
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: colors.textDim,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  host: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  hostText: {
    fontSize: 11,
    color: colors.textDim,
    flex: 1,
  },
  footerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  shareButton: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rsvpButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rsvpText: {
    color: colors.accentText,
    fontWeight: "600",
    fontSize: 13,
  },
});
