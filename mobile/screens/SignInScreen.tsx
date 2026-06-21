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
import { useAuth } from "../lib/auth";
import { formatAuthError, isEmailNotConfirmedError } from "../lib/auth-errors";
import { colors, radii, sharedStyles, spacing } from "../lib/theme";
import type { RootStackParamList } from "../navigation/types";

export function SignInScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setNeedsVerification(false);
    try {
      await signIn(email.trim(), password);
      navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid email or password";
      if (isEmailNotConfirmedError(message)) setNeedsVerification(true);
      setError(formatAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.card}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="flash" size={20} color={colors.accentText} />
            </View>
            <View>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to GearNet</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {needsVerification ? (
            <Pressable onPress={() => navigation.navigate("VerifyEmail", { email: email.trim() })}>
              <Text style={styles.link}>Resend verification email</Text>
            </Pressable>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={sharedStyles.input}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={sharedStyles.input}
          />

          <Pressable
            style={[sharedStyles.amberButton, { marginTop: 20 }, loading && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={sharedStyles.amberButtonText}>{loading ? "Signing in..." : "Sign In"}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.replace("SignUp")} style={styles.linkWrap}>
            <Text style={styles.link}>No account? Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, flexGrow: 1, justifyContent: "center" },
  back: { marginBottom: 16 },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    padding: spacing.xl,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textDim },
  label: { fontSize: 14, color: colors.textDim, marginBottom: 6 },
  error: {
    backgroundColor: "rgba(248,113,113,0.1)",
    color: colors.danger,
    padding: 10,
    borderRadius: radii.sm,
    marginBottom: 12,
    fontSize: 14,
  },
  disabled: { opacity: 0.5 },
  linkWrap: { marginTop: 24, alignItems: "center" },
  link: { color: colors.accent, fontSize: 14 },
  demo: { marginTop: 12, textAlign: "center", fontSize: 12, color: colors.textFaint },
});
