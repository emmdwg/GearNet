import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingState } from "../components/ui/LoadingState";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, radii, spacing } from "../lib/theme";
import type { UserProfile, UserSettings } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderLight, true: colors.accentDark }}
        thumbColor={colors.text}
      />
    </View>
  );
}

function OptionRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.optionBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.optionChip, value === opt.value && styles.optionChipActive]}
          >
            <Text style={[styles.optionText, value === opt.value && styles.optionTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const load = useCallback(async () => {
    const data = await api.getSettings();
    setSettings(data.settings);
    setProfile(data.profile);
  }, []);

  useEffect(() => {
    if (!user) {
      navigation.replace("SignIn");
      return;
    }
    load().finally(() => setLoading(false));
  }, [user, navigation, load]);

  async function save() {
    if (!settings || !profile) return;
    setSaving(true);
    try {
      await api.updateSettings({ settings, profile });
      setSaved("Settings saved");
      setTimeout(() => setSaved(""), 2000);
    } catch {
      setSaved("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings || !profile) return <LoadingState />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Account, privacy & notifications</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <SectionTitle>Account</SectionTitle>
        <TextInput
          value={profile.displayName}
          onChangeText={(v) => setProfile({ ...profile, displayName: v })}
          placeholder="Display name"
          style={styles.input}
          placeholderTextColor={colors.textFaint}
        />
        <TextInput value={profile.email} editable={false} style={[styles.input, styles.inputDisabled]} />
        <TextInput
          value={profile.bio ?? ""}
          onChangeText={(v) => setProfile({ ...profile, bio: v })}
          placeholder="Bio"
          style={[styles.input, styles.textarea]}
          placeholderTextColor={colors.textFaint}
          multiline
        />
        <TextInput
          value={profile.location ?? ""}
          onChangeText={(v) => setProfile({ ...profile, location: v })}
          placeholder="Location"
          style={styles.input}
          placeholderTextColor={colors.textFaint}
        />

        <SectionTitle>Privacy</SectionTitle>
        <OptionRow
          label="Profile visibility"
          value={settings.profileVisibility}
          onChange={(v) => setSettings({ ...settings, profileVisibility: v })}
          options={[
            { value: "public", label: "Public" },
            { value: "followers", label: "Followers" },
            { value: "private", label: "Private" },
          ]}
        />
        <ToggleRow label="Show location on profile" value={settings.showLocation} onChange={(v) => setSettings({ ...settings, showLocation: v })} />
        <ToggleRow label="Show garage publicly" value={settings.showGarage} onChange={(v) => setSettings({ ...settings, showGarage: v })} />
        <OptionRow
          label="Messages"
          value={settings.allowMessages}
          onChange={(v) => setSettings({ ...settings, allowMessages: v })}
          options={[
            { value: "everyone", label: "Everyone" },
            { value: "following", label: "Following" },
            { value: "none", label: "None" },
          ]}
        />

        <SectionTitle>Notifications</SectionTitle>
        <ToggleRow label="Email notifications" value={settings.emailNotifications} onChange={(v) => setSettings({ ...settings, emailNotifications: v })} />
        <ToggleRow label="Push notifications" value={settings.pushNotifications} onChange={(v) => setSettings({ ...settings, pushNotifications: v })} />
        <ToggleRow label="Activity alerts" value={settings.activityAlerts} onChange={(v) => setSettings({ ...settings, activityAlerts: v })} />
        <ToggleRow label="Message alerts" value={settings.messageAlerts} onChange={(v) => setSettings({ ...settings, messageAlerts: v })} />
        <ToggleRow label="Meet reminders" value={settings.meetReminders} onChange={(v) => setSettings({ ...settings, meetReminders: v })} />

        <SectionTitle>Appearance</SectionTitle>
        <OptionRow
          label="Theme"
          value={settings.theme}
          onChange={(v) => setSettings({ ...settings, theme: v })}
          options={[
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
        />

        <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>
        {saved ? <Text style={styles.saved}>{saved}</Text> : null}

        <SectionTitle>Account actions</SectionTitle>
        <Pressable
          style={styles.signOutBtn}
          onPress={async () => {
            await signOut();
            navigation.navigate("MainTabs");
          }}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <SectionTitle>About</SectionTitle>
        <View style={styles.legalRow}>
          <Pressable onPress={() => navigation.navigate("Legal", { doc: "terms" })}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.legalSep}>·</Text>
          <Pressable onPress={() => navigation.navigate("Legal", { doc: "privacy" })}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textDim, marginTop: 2 },
  body: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textDim,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  inputDisabled: { opacity: 0.6 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
  },
  toggleLabel: { flex: 1, fontSize: 14, color: colors.text, marginRight: 12 },
  optionBlock: { gap: 8 },
  fieldLabel: { fontSize: 13, color: colors.textDim },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  optionChipActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  optionText: { fontSize: 13, color: colors.textDim },
  optionTextActive: { color: colors.accent },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: colors.accentText, fontWeight: "600", fontSize: 15 },
  saved: { textAlign: "center", color: colors.success, fontSize: 13 },
  legalRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  legalLink: { color: colors.accent, fontSize: 14 },
  legalSep: { color: colors.textFaint },
  signOutBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: colors.textMuted, fontSize: 14 },
});
