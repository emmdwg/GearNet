import { Ionicons } from "@expo/vector-icons";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { useScrollChrome } from "../../lib/scroll-chrome";
import { colors, spacing } from "../../lib/theme";
import { Avatar } from "./Avatar";

type Props = {
  onProfilePress?: () => void;
  onActivityPress?: () => void;
  onClubsPress?: () => void;
  onBenchPress?: () => void;
  onSettingsPress?: () => void;
  onSearchPress?: () => void;
  onSavedPress?: () => void;
  onCollectionsPress?: () => void;
  rightAction?: React.ReactNode;
  unreadCount?: number;
};

function HeaderIcon({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  if (!onPress) return null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.iconBtn}
    >
      {children}
    </Pressable>
  );
}

export function ExploreBrandBar({
  onProfilePress,
  onActivityPress,
  onClubsPress,
  onBenchPress,
  onSettingsPress,
  onSearchPress,
  onSavedPress,
  onCollectionsPress,
  rightAction,
  unreadCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { progress } = useScrollChrome();

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.sm },
        {
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -8],
              }),
            },
          ],
          opacity: progress.interpolate({
            inputRange: [0, 0.55, 1],
            outputRange: [1, 0.35, 0],
          }),
          maxHeight: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [120, 0],
          }),
          overflow: "hidden" as const,
          borderBottomWidth: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        },
      ]}
    >
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
          <HeaderIcon label="Search" onPress={onSearchPress}>
            <Ionicons name="search-outline" size={22} color={colors.textDim} />
          </HeaderIcon>
          <HeaderIcon label="Collections" onPress={onCollectionsPress}>
            <Ionicons name="folder-open-outline" size={22} color={colors.textDim} />
          </HeaderIcon>
          <HeaderIcon label="Saved" onPress={onSavedPress}>
            <Ionicons name="bookmark-outline" size={22} color={colors.textDim} />
          </HeaderIcon>
          <HeaderIcon label="Service Bench" onPress={onBenchPress}>
            <Ionicons name="construct-outline" size={22} color={colors.textDim} />
          </HeaderIcon>
          <HeaderIcon label="Clubs" onPress={onClubsPress}>
            <Ionicons name="people-outline" size={22} color={colors.textDim} />
          </HeaderIcon>
          {onActivityPress ? (
            <Pressable
              onPress={onActivityPress}
              accessibilityLabel="Activity"
              hitSlop={8}
              style={[styles.iconBtn, styles.bell]}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.textDim} />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
          <HeaderIcon label="Settings" onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={22} color={colors.textDim} />
          </HeaderIcon>
          {rightAction}
          <Pressable
            onPress={onProfilePress}
            accessibilityLabel={user ? "Open profile" : "Sign in"}
            hitSlop={8}
            style={styles.iconBtn}
          >
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
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
  tagline: { fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: colors.textFaint },
  actions: { flexDirection: "row", alignItems: "center", gap: 0 },
  iconBtn: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bell: { position: "relative" },
  badge: {
    position: "absolute",
    top: 6,
    right: 4,
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
