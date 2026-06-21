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
import { AvatarPicker } from "../components/ui/AvatarPicker";
import { CoverPicker } from "../components/ui/CoverPicker";
import { LoadingState } from "../components/ui/LoadingState";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
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
  const { user, signOut, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameHint, setUsernameHint] = useState("");
  const [pushStatus, setPushStatus] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const data = await api.getSettings();
    setSettings(data.settings);
    setProfile(data.profile);
    setUsernameDraft(data.profile.username);
  }, []);

  useEffect(() => {
    if (!user) {
      navigation.replace("SignIn");
      return;
    }
    load().finally(() => setLoading(false));

    api
      .getUsernameAvailability()
      .then((d) => {
        if (d.nextChangeAt) {
          setUsernameHint(`Next change available ${new Date(d.nextChangeAt).toLocaleDateString()}`);
        }
      })
      .catch(() => {});
  }, [user, navigation, load]);

  async function saveCover(coverImage: string) {
    try {
      await api.updateSettings({ profile: { coverImage } });
      await refreshProfile();
    } catch {
      /* ignore */
    }
  }

  async function enablePush() {
    setPushStatus("Enabling...");
    try {
      const { registerForPushNotifications } = await import("../lib/push");
      const token = await registerForPushNotifications();
      setPushStatus(token ? "Push notifications enabled" : "Permission denied or unavailable on simulator");
    } catch {
      setPushStatus("Could not enable push notifications");
    }
  }

  async function saveUsername() {
    setUsernameError("");
    try {
      const data = await api.changeUsername(usernameDraft.trim());
      setProfile({ ...profile!, username: data.username });
      await refreshProfile();
      setSaved("Username updated");
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : "Could not update username");
    }
  }

  async function saveAvatar(avatar: string) {
    try {
      await api.updateSettings({ profile: { avatar } });
      await refreshProfile();
    } catch {
      /* ignore */
    }
  }

  async function save() {
    if (!settings || !profile) return;
    setSaving(true);
    try {
      await api.updateSettings({ settings, profile });
      await refreshProfile();
      setSaved("Settings saved");
      setTimeout(() => setSaved(""), 2000);
    } catch {
      setSaved("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated.");
  }

  async function deleteAccount() {
    if (!profile || deleteConfirm !== profile.username) return;
    setDeleting(true);
    setPasswordError("");
    try {
      await api.deleteAccount();
      await signOut();
      navigation.navigate("MainTabs");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDeleting(false);
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
        <View style={styles.profileCard}>
          <AvatarPicker
            value={profile.avatar ?? ""}
            onChange={(v) => {
              setProfile({ ...profile, avatar: v });
              saveAvatar(v);
            }}
            label="Tap to change photo"
            size={88}
            uploadOnPick
          />
          <CoverPicker
            value={profile.coverImage ?? ""}
            onChange={(v) => {
              setProfile({ ...profile, coverImage: v });
              saveCover(v);
            }}
          />
        </View>

        <SectionTitle>Account</SectionTitle>
        <Text style={styles.fieldLabel}>Username</Text>
        <View style={styles.usernameRow}>
          <TextInput
            value={usernameDraft}
            onChangeText={setUsernameDraft}
            autoCapitalize="none"
            style={[styles.input, { flex: 1 }]}
            placeholderTextColor={colors.textFaint}
          />
          <Pressable style={styles.updateBtn} onPress={saveUsername} disabled={usernameDraft === profile.username}>
            <Text style={styles.updateBtnText}>Update</Text>
          </Pressable>
        </View>
        {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
        {usernameHint ? <Text style={styles.hintText}>{usernameHint}</Text> : null}
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
        <ToggleRow
          label="Push notifications"
          value={settings.pushNotifications}
          onChange={(v) => {
            setSettings({ ...settings, pushNotifications: v });
            if (v) enablePush();
          }}
        />
        {settings.pushNotifications ? (
          <Pressable style={styles.pushBtn} onPress={enablePush}>
            <Text style={styles.pushBtnText}>{pushStatus || "Enable device notifications"}</Text>
          </Pressable>
        ) : null}
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

        <SectionTitle>Account security</SectionTitle>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          placeholderTextColor={colors.textFaint}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textFaint}
          secureTextEntry
          style={styles.input}
        />
        <Pressable style={styles.linkBtn} onPress={changePassword}>
          <Text style={styles.linkBtnText}>Update password</Text>
        </Pressable>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        {passwordMessage ? <Text style={styles.saved}>{passwordMessage}</Text> : null}

        <SectionTitle>Quick links</SectionTitle>
        <Pressable
          style={styles.linkBtn}
          onPress={() => navigation.navigate("Profile", { username: profile.username })}
        >
          <Text style={styles.linkBtnText}>View public profile</Text>
        </Pressable>

        <SectionTitle>Danger zone</SectionTitle>
        <Text style={styles.dangerHint}>Permanently delete your account and all data.</Text>
        <TextInput
          value={deleteConfirm}
          onChangeText={setDeleteConfirm}
          placeholder={`Type ${profile.username} to confirm`}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
        <Pressable
          style={[styles.dangerBtn, (deleting || deleteConfirm !== profile.username) && { opacity: 0.5 }]}
          onPress={deleteAccount}
          disabled={deleting || deleteConfirm !== profile.username}
        >
          <Text style={styles.dangerBtnText}>{deleting ? "Deleting..." : "Delete account"}</Text>
        </Pressable>

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
  profileCard: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    gap: spacing.md,
    width: "100%",
  },
  usernameRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  updateBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  updateBtnText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 12 },
  hintText: { color: colors.textDim, fontSize: 12, marginBottom: 4 },
  pushBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    alignItems: "center",
  },
  pushBtnText: { color: colors.textMuted, fontSize: 13 },
  linkBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 14,
    alignItems: "center",
  },
  linkBtnText: { color: colors.textMuted, fontSize: 14 },
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
  errorText: { color: colors.danger, fontSize: 12 },
  dangerHint: { fontSize: 13, color: colors.textDim, marginBottom: 4 },
  dangerBtn: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerBtnText: { color: colors.danger, fontWeight: "600" },
});
