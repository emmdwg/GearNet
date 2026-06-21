import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors, radii, spacing } from "../lib/theme";
import type { RootStackParamList } from "../navigation/types";

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setMessage("");

    const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
    const redirectTo = `${baseUrl}/auth/callback?next=/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage("Check your email for a password reset link.");
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>We&apos;ll email you a reset link</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Pressable style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Sending..." : "Send reset link"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  back: { marginBottom: spacing.lg, padding: 4, alignSelf: "flex-start" },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textDim, marginBottom: spacing.sm },
  label: { fontSize: 13, color: colors.textDim, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: colors.accentText, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 13 },
  success: { color: "#34d399", fontSize: 13 },
});
