import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "../lib/theme";
import type { RootStackParamList } from "../navigation/types";

const LAST_UPDATED = "June 20, 2026";

const TERMS: { heading: string; body: string }[] = [
  { heading: "1. Acceptance of Terms", body: "By creating an account or using GearNet, you agree to these Terms of Service. If you do not agree, do not use the app." },
  { heading: "2. Eligibility", body: "You must be at least 13 years old (or the minimum age of digital consent in your country) to use GearNet." },
  { heading: "3. Your Account", body: "You are responsible for safeguarding your login credentials and for all activity under your account." },
  { heading: "4. User Content", body: "You retain ownership of the photos, builds, listings, and messages you post. By posting, you grant GearNet a license to display that content within the app. You are responsible for content you post." },
  { heading: "5. Acceptable Use", body: "Do not post unlawful, hateful, harassing, or infringing content; do not spam or attempt to disrupt the service. Marketplace listings must be accurate and for legal goods." },
  { heading: "6. Marketplace & Transactions", body: "GearNet connects buyers and sellers but is not a party to transactions between users. Transact at your own risk." },
  { heading: "7. Termination", body: "You may delete your account at any time. We may suspend or terminate access for violations of these terms." },
  { heading: "8. Disclaimers", body: "The service is provided \u201cas is\u201d without warranties. GearNet is not liable for indirect or consequential damages arising from your use of the app." },
  { heading: "9. Contact", body: "Questions? Reach us at support@gearnet.app." },
];

const PRIVACY: { heading: string; body: string }[] = [
  { heading: "1. Information We Collect", body: "Account info you provide (email, username, display name, bio, location, avatar), content you create (posts, vehicles, listings, messages, comments), and usage data collected automatically." },
  { heading: "2. How We Use Your Information", body: "To operate and improve the app, authenticate you, deliver notifications you enabled, and power features like the feed, follows, and chat." },
  { heading: "3. What Others Can See", body: "Your profile, garage, posts, and listings are visible to other users according to your privacy settings. Messages are visible to conversation participants." },
  { heading: "4. Service Providers", body: "We use third parties to run GearNet, including Supabase (auth, database, storage) and may use image hosting and error-monitoring providers." },
  { heading: "5. Data Retention", body: "We keep your data while your account is active. When you delete content or your account, we remove it, subject to backups and legal requirements." },
  { heading: "6. Your Rights", body: "Depending on your location, you may have rights to access, correct, export, or delete your personal data. Contact us to exercise these rights." },
  { heading: "7. Security", body: "We use industry-standard measures to protect your data, but no method of transmission or storage is 100% secure." },
  { heading: "8. Contact", body: "Questions about your privacy? Email privacy@gearnet.app." },
];

export function LegalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Legal">>();
  const insets = useSafeAreaInsets();
  const { doc } = route.params;

  const isTerms = doc === "terms";
  const title = isTerms ? "Terms of Service" : "Privacy Policy";
  const sections = isTerms ? TERMS : PRIVACY;

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated {LAST_UPDATED}</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            This is a starter template. Have a lawyer review and tailor it before relying on it publicly.
          </Text>
        </View>
        {sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <Pressable
          style={styles.switchLink}
          onPress={() => navigation.replace("Legal", { doc: isTerms ? "privacy" : "terms" })}
        >
          <Text style={styles.switchText}>
            {isTerms ? "Read our Privacy Policy" : "Read our Terms of Service"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  updated: { fontSize: 12, color: colors.textDim, marginBottom: spacing.md },
  notice: {
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    backgroundColor: "rgba(245,158,11,0.06)",
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: { fontSize: 13, color: colors.accent, lineHeight: 18 },
  section: { marginBottom: spacing.lg },
  heading: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 6 },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  switchLink: { marginTop: spacing.sm, alignItems: "center" },
  switchText: { color: colors.accent, fontSize: 14 },
});
