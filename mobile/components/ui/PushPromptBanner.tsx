import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { registerForPushNotifications } from "../../lib/push";
import { colors, radii, spacing } from "../../lib/theme";

export function PushPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setVisible(status !== "granted");
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  if (!visible) return null;

  async function enable() {
    setLoading(true);
    try {
      const token = await registerForPushNotifications();
      if (token) setVisible(false);
      else {
        Alert.alert(
          "Notifications",
          "Permission was denied or registration failed. You can enable notifications in system settings.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="notifications-outline" size={20} color={colors.accent} />
      <View style={styles.body}>
        <Text style={styles.title}>Turn on push notifications</Text>
        <Text style={styles.sub}>Get alerts for likes, follows, meets & messages.</Text>
      </View>
      <Pressable style={styles.btn} onPress={enable} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "..." : "Enable"}</Text>
      </Pressable>
      <Pressable onPress={() => setVisible(false)} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textDim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: "600", color: colors.text },
  sub: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  btnText: { fontSize: 12, fontWeight: "600", color: colors.accentText },
});
