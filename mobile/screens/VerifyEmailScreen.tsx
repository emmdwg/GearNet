import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";
import { colors, radii, sharedStyles, spacing } from "../lib/theme";
import type { RootStackParamList } from "../navigation/types";

export function VerifyEmailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "VerifyEmail">>();
  const insets = useSafeAreaInsets();
  const { resendVerificationEmail } = useAuth();
  const email = route.params.email;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await resendVerificationEmail(email);
      setMessage("Verification email sent. Check your inbox and spam folder.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={28} color={colors.accent} />
        </View>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.body}>
          We sent a confirmation link to <Text style={styles.email}>{email}</Text>. Open it to activate your account,
          then sign in.
        </Text>
        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[sharedStyles.outlineButton, loading && styles.disabled]} onPress={resend} disabled={loading}>
          <Text style={sharedStyles.outlineButtonText}>{loading ? "Sending..." : "Resend verification email"}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.replace("SignIn")} style={styles.linkWrap}>
          <Text style={styles.link}>Already verified? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  back: { marginBottom: 16 },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    padding: spacing.xl,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  body: { marginTop: 10, fontSize: 14, color: colors.textDim, textAlign: "center", lineHeight: 20 },
  email: { color: colors.text, fontWeight: "600" },
  success: { marginTop: 12, fontSize: 13, color: colors.success, textAlign: "center" },
  error: { marginTop: 12, fontSize: 13, color: colors.danger, textAlign: "center" },
  disabled: { opacity: 0.5 },
  linkWrap: { marginTop: 20 },
  link: { color: colors.accent, fontSize: 14 },
});
