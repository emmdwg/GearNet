import { Pressable, StyleSheet, Text, View } from "react-native";
import { API_URL } from "../../lib/api";
import { colors, radii, spacing } from "../../lib/theme";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Connection Error", message, onRetry }: Props) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>
        1. Run npm run dev in a separate terminal{"\n"}
        2. Phone must be on the same Wi-Fi as this PC{"\n"}
        3. On Windows, run scripts/open-firewall.ps1 as Admin{"\n"}
        API URL: {API_URL}
      </Text>
      {onRetry ? (
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  message: {
    color: colors.danger,
    textAlign: "center",
    marginBottom: 12,
  },
  hint: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryText: {
    color: colors.accentText,
    fontWeight: "600",
  },
});
