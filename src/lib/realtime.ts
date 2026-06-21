import { broadcastMessage as broadcastPusherMessage, isPusherConfigured } from "@/lib/pusher";
import { createAdminClient } from "@/lib/supabase/admin";

export function isRealtimeConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isRealtimeAvailableOnClient() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function conversationChannelId(conversationId: string) {
  return `conversation:${conversationId}`;
}

export async function broadcastChatMessage(conversationId: string, message: unknown) {
  if (isRealtimeConfigured()) {
    const supabase = createAdminClient();
    const channel = supabase.channel(conversationChannelId(conversationId), {
      config: { broadcast: { ack: false } },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        supabase.removeChannel(channel);
        reject(new Error("Realtime broadcast timeout"));
      }, 5000);

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const result = await channel.send({
            type: "broadcast",
            event: "new-message",
            payload: message,
          });
          clearTimeout(timeout);
          await supabase.removeChannel(channel);
          if (result === "ok") resolve();
          else reject(new Error("Realtime broadcast failed"));
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timeout);
          reject(new Error(`Realtime channel ${status}`));
        }
      });
    });
    return;
  }

  if (isPusherConfigured()) {
    await broadcastPusherMessage(conversationId, message);
  }
}
