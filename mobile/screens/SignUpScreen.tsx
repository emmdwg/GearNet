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
import { AvatarPicker } from "../components/ui/AvatarPicker";
import type { RootStackParamList } from "../navigation/types";

type Mode = "email" | "phone";

export function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUp, sendPhoneOtp, verifyPhoneSignup } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("email");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit() {
    setLoading(true);
    setError("");
    try {
      await signUp({ email: email.trim(), password, username: username.trim(), displayName: displayName.trim(), avatar: avatar || undefined });
      navigation.replace("VerifyEmail", { email: email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    setLoading(true);
    setError("");
    try {
      await sendPhoneOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit() {
    setLoading(true);
    setError("");
    try {
      await verifyPhoneSignup({
        phone,
        otp,
        username: username.trim(),
        displayName: displayName.trim(),
        avatar: avatar || undefined,
      });
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

          <AvatarPicker value={avatar} onChange={setAvatar} label="Add profile photo (optional)" size={88} />

          <View style={styles.tabs}>
            {(["email", "phone"] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, mode === tab && styles.tabActive]}
                onPress={() => {
                  setMode(tab);
                  setError("");
                }}
              >
                <Text style={[styles.tabText, mode === tab && styles.tabTextActive]}>
                  {tab === "email" ? "Email" : "Phone"}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Display Name</Text>
          <TextInput value={displayName} onChangeText={setDisplayName} autoCapitalize="words" style={sharedStyles.input} />
          <Text style={[styles.label, { marginTop: 12 }]}>Username</Text>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={sharedStyles.input} />

          {mode === "email" ? (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={sharedStyles.input}
              />
              <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry style={sharedStyles.input} />
              <Pressable
                style={[sharedStyles.amberButton, { marginTop: 20 }, loading && styles.disabled]}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                <Text style={sharedStyles.amberButtonText}>{loading ? "Creating..." : "Create Account"}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Phone</Text>
              <View style={styles.phoneRow}>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="5551234567"
                  placeholderTextColor={colors.textFaint}
                  style={[sharedStyles.input, { flex: 1 }]}
                />
                <Pressable style={styles.codeBtn} onPress={handleSendOtp} disabled={loading || !phone}>
                  <Text style={styles.codeBtnText}>{otpSent ? "Resend" : "Send code"}</Text>
                </Pressable>
              </View>
              <Text style={[styles.label, { marginTop: 12 }]}>Verification code</Text>
              <TextInput value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} style={sharedStyles.input} />
              <Pressable
                style={[sharedStyles.amberButton, { marginTop: 20 }, (loading || !otpSent) && styles.disabled]}
                onPress={handlePhoneSubmit}
                disabled={loading || !otpSent}
              >
                <Text style={sharedStyles.amberButtonText}>{loading ? "Verifying..." : "Verify & Create Account"}</Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={() => navigation.replace("SignIn")} style={styles.linkWrap}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
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
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
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
  tabs: { flexDirection: "row", gap: 8, marginBottom: 16, backgroundColor: colors.background, borderRadius: radii.sm, padding: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radii.sm },
  tabActive: { backgroundColor: colors.card },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textDim },
  tabTextActive: { color: colors.text },
  label: { fontSize: 14, color: colors.textDim, marginBottom: 6 },
  error: {
    backgroundColor: "rgba(248,113,113,0.1)",
    color: colors.danger,
    padding: 10,
    borderRadius: radii.sm,
    marginBottom: 12,
    fontSize: 14,
  },
  phoneRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  codeBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  codeBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  linkWrap: { marginTop: 24, alignItems: "center" },
  link: { color: colors.accent, fontSize: 14 },
});
