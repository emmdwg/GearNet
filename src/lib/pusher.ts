import Pusher from "pusher";

export function isPusherConfigured() {
  return Boolean(
    process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_CLUSTER
  );
}

export function getPusherServer() {
  if (!isPusherConfigured()) return null;

  return new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });
}

export function conversationChannel(conversationId: string) {
  return `conversation-${conversationId}`;
}

export async function broadcastMessage(conversationId: string, message: unknown) {
  const pusher = getPusherServer();
  if (!pusher) return;

  await pusher.trigger(conversationChannel(conversationId), "new-message", message);
}
