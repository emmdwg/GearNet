"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { conversationChannelId, isRealtimeAvailableOnClient } from "@/lib/realtime";

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
};

export function useConversationRealtime(
  conversationId: string | undefined,
  onMessage: (message: ChatMessage) => void
) {
  useEffect(() => {
    if (!conversationId || !isRealtimeAvailableOnClient()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(conversationChannelId(conversationId))
      .on("broadcast", { event: "new-message" }, ({ payload }) => {
        onMessage(payload as ChatMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onMessage]);
}
