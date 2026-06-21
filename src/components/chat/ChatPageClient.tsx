"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { useSearchParams } from "next/navigation";

type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  otherUser: { id: string; username: string; displayName: string; avatar: string } | null;
};

export function ChatPageClient({ initialConversations }: { initialConversations: Conversation[] }) {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation") ?? undefined;

  return <ChatPanel initialConversations={initialConversations} initialConversationId={conversationId} />;
}
