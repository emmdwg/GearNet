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
import { colors, radii, sharedStyles, spacing } from "../lib/theme";
import type { RootStackParamList } from "../navigation/types";

export function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      await signUp({ email: email.trim(), password, username: username.trim(), displayName: displayName.trim() });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
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
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="flash" size={20} color={colors.accentText} />
            </View>
            <View>
              <Text style={styles.title}>Join GearNet</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {(["Display Name", "Username", "Email", "Password"] as const).map((label, i) => {
            const fields = [
              { value: displayName, set: setDisplayName, secure: false, auto: "words" as const },
              { value: username, set: setUsername, secure: false, auto: "none" as const },
              { value: email, set: setEmail, secure: false, auto: "none" as const },
              { value: password, set: setPassword, secure: true, auto: "none" as const },
            ][i];
            return (
              <View key={label} style={{ marginTop: i === 0 ? 0 : 12 }}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  value={fields.value}
                  onChangeText={fields.set}
                  secureTextEntry={fields.secure}
                  autoCapitalize={fields.auto}
                  keyboardType={label === "Email" ? "email-address" : "default"}
                  style={sharedStyles.input}
                />
              </View>
            );
          })}

          <Pressable
            style={[sharedStyles.amberButton, { marginTop: 20 }, loading && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={sharedStyles.amberButtonText}>{loading ? "Creating..." : "Create Account"}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.replace("SignIn")} style={styles.linkWrap}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>

          <Text style={styles.legal}>
            By creating an account you agree to our{" "}
            <Text style={styles.legalLink} onPress={() => navigation.navigate("Legal", { doc: "terms" })}>
              Terms
            </Text>{" "}
            and{" "}
            <Text style={styles.legalLink} onPress={() => navigation.navigate("Legal", { doc: "privacy" })}>
              Privacy Policy
            </Text>
            .
          </Text>
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
  legal: { marginTop: 16, textAlign: "center", fontSize: 12, color: colors.textFaint, lineHeight: 17 },
  legalLink: { color: colors.accent },
});
