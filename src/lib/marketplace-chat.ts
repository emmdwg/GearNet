import { isBlocked } from "@/lib/blocking";
import { canSendMessage } from "@/lib/privacy";
import { broadcastChatMessage } from "@/lib/realtime";
import { formatTradeOfferMessage } from "@/lib/marketplace-offer-message";
import { prisma } from "@/lib/prisma";

export async function getOrCreateConversation(userId: string, participantId: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "dm",
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: participantId } } },
      ],
      participants: { every: { userId: { in: [userId, participantId] } } },
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      type: "dm",
      participants: {
        create: [{ userId }, { userId: participantId }],
      },
    },
  });
}

export async function sendConversationMessage(conversationId: string, senderId: string, content: string) {
  const message = await prisma.message.create({
    data: { conversationId, senderId, content: content.trim() },
  });

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: senderId } },
    data: { lastReadAt: new Date() },
  });

  try {
    await broadcastChatMessage(conversationId, {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sentAt: message.sentAt.toISOString(),
    });
  } catch {
    // ignore broadcast failures
  }

  return message;
}

export async function openMarketplaceChat(
  fromUserId: string,
  toUserId: string,
  initialMessage: string,
): Promise<{ conversationId: string } | { error: string; status: number }> {
  if (await isBlocked(fromUserId, toUserId)) {
    return { error: "Cannot message this user", status: 403 };
  }
  if (!(await canSendMessage(toUserId, fromUserId))) {
    return { error: "This user is not accepting messages", status: 403 };
  }

  const conversation = await getOrCreateConversation(fromUserId, toUserId);
  await sendConversationMessage(conversation.id, fromUserId, initialMessage);
  return { conversationId: conversation.id };
}

export { formatTradeOfferMessage } from "@/lib/marketplace-offer-message";
