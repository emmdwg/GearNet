import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { colors, spacing } from "../../lib/theme";
import { Avatar } from "./Avatar";

type Props = {
  title: string;
  subtitle?: string;
  onProfilePress?: () => void;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, onProfilePress, rightAction }: Props) {
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
          {rightAction}
          <Pressable
            onPress={onProfilePress}
            accessibilityRole="button"
            accessibilityLabel={user ? "Open profile" : "Sign in"}
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
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  tagline: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.textDim,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signInDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 4,
  },
});
