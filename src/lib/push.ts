import { prisma } from "@/lib/prisma";

type PushPayload = { title: string; body: string; url?: string };

let webPushConfigured = false;

async function getWebPush() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return null;
  const webpush = await import("web-push");
  if (!webPushConfigured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:kachurtaylor5@gmail.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    webPushConfigured = true;
  }
  return webpush;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const tokens = await prisma.pushToken.findMany({ where: { userId } });
  if (tokens.length === 0) return;

  const webPush = await getWebPush();
  const { Expo } = await import("expo-server-sdk");
  const expo = new Expo();

  await Promise.allSettled(
    tokens.map(async (entry) => {
      if (entry.platform === "web" && webPush) {
        try {
          const sub = JSON.parse(entry.token);
          await webPush.sendNotification(sub, JSON.stringify(payload));
        } catch {
          await prisma.pushToken.delete({ where: { token: entry.token } }).catch(() => {});
        }
        return;
      }

      if (entry.platform === "expo" && Expo.isExpoPushToken(entry.token)) {
        await expo.sendPushNotificationsAsync([
          {
            to: entry.token,
            sound: "default",
            title: payload.title,
            body: payload.body,
            data: payload.url ? { url: payload.url } : undefined,
          },
        ]);
      }
    })
  );
}
