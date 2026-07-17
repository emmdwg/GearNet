"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { conversationChannelId, isRealtimeAvailableOnClient } from "@/lib/realtime";

type ChatMessageNudge = {
  id: string;
  conversationId: string;
  senderId: string;
  sentAt: string;
  content?: string;
};

type ReadReceipt = {
  userId: string;
  readAt: string;
};

export function useConversationRealtime(
  conversationId: string | undefined,
  onMessage: (message: ChatMessageNudge) => void,
  onReadReceipt?: (receipt: ReadReceipt) => void
) {
  useEffect(() => {
    if (!conversationId || !isRealtimeAvailableOnClient()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(conversationChannelId(conversationId))
      .on("broadcast", { event: "new-message" }, ({ payload }) => {
        onMessage(payload as ChatMessageNudge);
      })
      .on("broadcast", { event: "read-receipt" }, ({ payload }) => {
        onReadReceipt?.(payload as ReadReceipt);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onMessage, onReadReceipt]);
}
