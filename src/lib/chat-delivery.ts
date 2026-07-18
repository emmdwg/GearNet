type ChatMessage = { senderId: string; sentAt: string };

export type MessageDeliveryStatus = "Sending…" | "Sent" | "Delivered" | "Read";

export function getLatestOutgoingDeliveryStatus(
  messages: ChatMessage[],
  userId: string,
  otherLastReadAt: string | null | undefined,
  sending?: boolean,
  otherDeliveredAt?: string | null
): MessageDeliveryStatus | null {
  const last = messages[messages.length - 1];
  if (!last || last.senderId !== userId) return null;
  if (sending) return "Sending…";
  const sentAt = new Date(last.sentAt).getTime();
  if (otherLastReadAt && new Date(otherLastReadAt).getTime() >= sentAt) {
    return "Read";
  }
  if (otherDeliveredAt && new Date(otherDeliveredAt).getTime() >= sentAt) {
    return "Delivered";
  }
  return "Sent";
}

export type ConversationMessagesResponse = {
  messages: ChatMessage[];
  otherLastReadAt: string | null;
  otherDeliveredAt?: string | null;
};
