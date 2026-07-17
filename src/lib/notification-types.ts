/** Notification `type` values used when creating notifications across the app. */
export const NOTIFICATION_TYPES = [
  "like",
  "reply",
  "comment",
  "mention",
  "collab",
  "follow",
  "follow_request",
  "message",
  "post",
  "recall",
  "referral",
  "trade_offer",
  "trade",
  "marketplace",
  "saved_search",
  "wishlist_match",
  "price_drop",
  "moderation",
  "verified_seller_request",
  "verified_shop_request",
  "meet",
  "event",
  "meet_reminder",
  "rsvp",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Notification `targetType` values used with targetId for deep links. */
export const NOTIFICATION_TARGET_TYPES = [
  "post",
  "pit_update",
  "listing",
  "message",
  "conversation",
  "comment",
  "user",
  "vehicle",
  "event",
  "club",
  "trade_offer",
  "recall",
  "follow_request",
  "report",
] as const;

export type NotificationTargetType = (typeof NOTIFICATION_TARGET_TYPES)[number];

export function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function isNotificationTargetType(value: string): value is NotificationTargetType {
  return (NOTIFICATION_TARGET_TYPES as readonly string[]).includes(value);
}

type HrefInput = {
  type: string;
  targetType?: string | null;
  targetId?: string | null;
  actorUsername?: string | null;
};

/**
 * Sync path builder for activity UI + push payloads.
 * Prefer concrete target routes; fall back by notification type.
 */
export function getNotificationHref(data: HrefInput): string {
  const { type, targetType, targetId, actorUsername } = data;

  if (type === "referral") return "/settings";
  if (type === "recall") return "/bench";

  if (type === "message") {
    if ((targetType === "conversation" || targetType === "message") && targetId) {
      return `/chat?conversation=${targetId}`;
    }
    return "/chat";
  }

  if (targetType === "post" && targetId) return `/explore?post=${targetId}`;
  if (targetType === "pit_update" && targetId) return `/explore?pit=${targetId}`;
  if (targetType === "listing" && targetId) return `/marketplace/${targetId}`;
  if (targetType === "vehicle" && targetId) return `/garage/vehicle/${targetId}`;
  if (targetType === "event" && targetId) return `/events?event=${targetId}`;
  if (targetType === "club" && targetId) return `/clubs/${targetId}`;
  if (targetType === "user" && targetId && actorUsername) return `/profile/${actorUsername}`;

  if (
    type === "like" ||
    type === "reply" ||
    type === "comment" ||
    type === "mention" ||
    type === "collab" ||
    type === "post"
  ) {
    if (targetId && (targetType === "post" || !targetType)) return `/explore?post=${targetId}`;
    if (targetId && targetType === "pit_update") return `/explore?pit=${targetId}`;
    if (targetId) return `/post/${targetId}`;
    return "/explore";
  }

  if (type === "trade_offer") {
    if (targetType === "listing" && targetId) return `/marketplace/${targetId}`;
    return "/marketplace/trades";
  }

  if (type === "trade") {
    if (targetType === "listing" && targetId) return `/marketplace/${targetId}`;
    return "/marketplace/trades";
  }

  if (
    type === "marketplace" ||
    type === "saved_search" ||
    type === "wishlist_match" ||
    type === "price_drop"
  ) {
    if (targetId) return `/marketplace/${targetId}`;
    return "/marketplace";
  }

  if (type === "follow_request") return "/activity";

  if (type === "meet" || type === "event" || type === "meet_reminder" || type === "rsvp") {
    if (targetId) return `/events?event=${targetId}`;
    return "/events";
  }

  if (type === "follow" && actorUsername) return `/profile/${actorUsername}`;

  if (
    type === "moderation" ||
    type === "verified_seller_request" ||
    type === "verified_shop_request"
  ) {
    return "/activity";
  }

  if (actorUsername) return `/profile/${actorUsername}`;
  return "/activity";
}
