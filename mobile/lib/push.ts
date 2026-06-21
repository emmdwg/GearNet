import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "GearNet",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "e9ea28f1-9d31-446f-96bd-4a2baa3f8ec7",
  });

  const token = tokenData.data;
  await api.registerPushToken(token, "expo");
  return token;
}
