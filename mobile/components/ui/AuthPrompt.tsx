import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, sharedStyles, spacing } from "../../lib/theme";

type Props = {
  title: string;
  description: string;
  onSignIn: () => void;
  onSignUp?: () => void;
};

export function AuthPrompt({ title, description, onSignIn, onSignUp }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed-outline" size={28} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Pressable style={sharedStyles.amberButton} onPress={onSignIn}>
        <Text style={sharedStyles.amberButtonText}>Sign In</Text>
      </Pressable>
      {onSignUp ? (
        <Pressable onPress={onSignUp} style={styles.linkWrap}>
          <Text style={styles.link}>Create account</Text>
        </Pressable>
      ) : null}
      <Text style={styles.demo}>Demo: mike@gearnet.app / password123</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textDim,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  linkWrap: {
    marginTop: spacing.md,
  },
  link: {
    color: colors.accent,
    fontSize: 14,
  },
  demo: {
    marginTop: spacing.lg,
    fontSize: 12,
    color: colors.textFaint,
  },
});
