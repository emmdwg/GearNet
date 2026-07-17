type ChatMessage = { senderId: string; sentAt: string };

export type MessageDeliveryStatus = "Sending…" | "Sent" | "Read";

export function getLatestOutgoingDeliveryStatus(
  messages: ChatMessage[],
  userId: string,
  otherLastReadAt: string | null | undefined,
  sending?: boolean
): MessageDeliveryStatus | null {
  const last = messages[messages.length - 1];
  if (!last || last.senderId !== userId) return null;
  if (sending) return "Sending…";
  if (otherLastReadAt && new Date(otherLastReadAt) >= new Date(last.sentAt)) {
    return "Read";
  }
  return "Sent";
}

export type ConversationMessagesResponse = {
  messages: ChatMessage[];
  otherLastReadAt: string | null;
};
