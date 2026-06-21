import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { colors, spacing } from "../../lib/theme";
import { Avatar } from "./Avatar";

type Props = {
  onProfilePress?: () => void;
  onActivityPress?: () => void;
  onSettingsPress?: () => void;
  onSearchPress?: () => void;
  onSavedPress?: () => void;
  rightAction?: React.ReactNode;
  unreadCount?: number;
};

export function ExploreBrandBar({
  onProfilePress,
  onActivityPress,
  onSettingsPress,
  onSearchPress,
  onSavedPress,
  rightAction,
  unreadCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Ionicons name="flash" size={18} color={colors.accentText} />
          </View>
          <View>
            <Text style={styles.brand}>GearNet</Text>
            <Text style={styles.tagline}>Drive. Build. Connect.</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {onSearchPress ? (
            <Pressable onPress={onSearchPress} accessibilityLabel="Search">
              <Ionicons name="search-outline" size={22} color={colors.textDim} />
            </Pressable>
          ) : null}
          {onSavedPress ? (
            <Pressable onPress={onSavedPress} accessibilityLabel="Saved">
              <Ionicons name="bookmark-outline" size={22} color={colors.textDim} />
            </Pressable>
          ) : null}
          {onActivityPress ? (
            <Pressable onPress={onActivityPress} accessibilityLabel="Activity" style={styles.bell}>
              <Ionicons name="notifications-outline" size={22} color={colors.textDim} />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
          {onSettingsPress ? (
            <Pressable onPress={onSettingsPress} accessibilityLabel="Settings">
              <Ionicons name="settings-outline" size={22} color={colors.textDim} />
            </Pressable>
          ) : null}
          {rightAction}
          <Pressable onPress={onProfilePress} accessibilityLabel={user ? "Open profile" : "Sign in"}>
            {user ? (
              <Avatar src={user.avatar} alt={user.displayName} size="sm" ring />
            ) : (
              <View style={styles.signInDot}>
                <Ionicons name="person-outline" size={18} color={colors.textDim} />
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 16, fontWeight: "700", color: colors.text },
  tagline: { fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: colors.textDim },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  bell: { position: "relative" },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: colors.accentText },
  signInDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
