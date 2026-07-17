import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarPicker } from "../components/ui/AvatarPicker";
import { CoverPicker } from "../components/ui/CoverPicker";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { api, API_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { colors, radii, spacing } from "../lib/theme";
import { referralTierProgress } from "../lib/referrals";
import { SCENE_TAGS } from "../lib/scene-tags";
import type { CreatorLink, UserProfile, UserSettings } from "../lib/types";
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
  const [referralCount, setReferralCount] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [proMessage, setProMessage] = useState("");
  const [garageSlugDraft, setGarageSlugDraft] = useState("");
  const [analytics, setAnalytics] = useState<{
    profileViews: number;
    vehicleCount: number;
    modSpendTotal: number;
    postSaves?: number;
    listingClicks?: number;
    totalReactions?: number;
    reactions?: Record<string, number>;
  } | null>(null);
  const [creatorLinks, setCreatorLinks] = useState<CreatorLink[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editLinkTitle, setEditLinkTitle] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [sellerMessage, setSellerMessage] = useState("");
  const [shopMessage, setShopMessage] = useState("");
  const [mutedUsers, setMutedUsers] = useState<{ id: string; username: string; displayName: string }[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; username: string; displayName: string }[]>([]);
  const [crewMembers, setCrewMembers] = useState<{ userId: string; username: string; displayName: string; avatar: string }[]>([]);
  const [crewQuery, setCrewQuery] = useState("");
  const [crewSuggestions, setCrewSuggestions] = useState<{ id: string; username: string; displayName: string; avatar: string }[]>([]);
  const [crewBusy, setCrewBusy] = useState(false);
  const [vehicles, setVehicles] = useState<import("../lib/types").Vehicle[]>([]);
  const [primaryVehicleId, setPrimaryVehicleId] = useState<string | null>(null);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const data = await api.getSettings();
      setSettings(data.settings);
      setProfile(data.profile);
      setUsernameDraft(data.profile.username);
      setGarageSlugDraft(data.profile.garageSlug ?? "");
      setPrimaryVehicleId(data.profile.primaryVehicleId ?? null);
      setQuietStart(data.settings.quietHoursStart ?? "");
      setQuietEnd(data.settings.quietHoursEnd ?? "");
      if (data.profile.isPro) {
        api.getGarageAnalytics().then(setAnalytics).catch(() => {});
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn’t load settings");
    }
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

    api
      .getMyReferrals()
      .then((d) => setReferralCount(d.referralCount ?? 0))
      .catch(() => {});

    api.getVehicles().then(setVehicles).catch(() => setVehicles([]));
    api.getMutedUsers().then(setMutedUsers).catch(() => setMutedUsers([]));
    api.getBlockedUsers().then(setBlockedUsers).catch(() => setBlockedUsers([]));
    api.getCrew().then((d) => setCrewMembers(d.members ?? [])).catch(() => setCrewMembers([]));
    api.getCreatorLinks().then((d) => setCreatorLinks(d.links ?? [])).catch(() => setCreatorLinks([]));
  }, [user, navigation, load]);

  useEffect(() => {
    const q = crewQuery.trim().replace(/^@+/, "");
    if (q.length < 2) {
      setCrewSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .searchUsers(q)
        .then((users) => {
          const memberIds = new Set(crewMembers.map((m) => m.userId));
          setCrewSuggestions(users.filter((u) => !memberIds.has(u.id)).slice(0, 6));
        })
        .catch(() => setCrewSuggestions([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [crewQuery, crewMembers]);

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
      setSaved("Avatar updated");
      setTimeout(() => setSaved(""), 2000);
    } catch (err) {
      setSaved(err instanceof Error ? err.message : "Couldn’t update avatar");
      setTimeout(() => setSaved(""), 3000);
    }
  }

  async function save() {
    if (!settings || !profile) return;
    setSaving(true);
    try {
      await api.updateSettings({
        settings: {
          ...settings,
          quietHoursStart: quietStart.trim() || null,
          quietHoursEnd: quietEnd.trim() || null,
        },
        profile,
      });
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
      await api.deleteAccount(profile.username);
      await signOut();
      navigation.navigate("MainTabs");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingState />;
  if (loadError || !settings || !profile) {
    return (
      <ErrorState
        message={loadError || "Couldn’t load settings"}
        onBack={() => navigation.goBack()}
        onRetry={() => {
          setLoading(true);
          load().finally(() => setLoading(false));
        }}
      />
    );
  }

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

        <SectionTitle>Profile</SectionTitle>
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
          placeholder="Home area (city)"
          style={styles.input}
          placeholderTextColor={colors.textFaint}
        />
        <Text style={styles.hintText}>Default scene for Near you when GPS is off.</Text>

        <SectionTitle>Link in bio</SectionTitle>
        {creatorLinks.map((link) => (
          <View key={link.id} style={styles.linkRow}>
            {editingLinkId === link.id ? (
              <View style={{ flex: 1, gap: 8 }}>
                <TextInput
                  value={editLinkTitle}
                  onChangeText={setEditLinkTitle}
                  placeholder="Link title"
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                />
                <TextInput
                  value={editLinkUrl}
                  onChangeText={setEditLinkUrl}
                  placeholder="https://..."
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={async () => {
                      setLinkBusy(true);
                      try {
                        const updated = await api.updateCreatorLink(link.id, {
                          title: editLinkTitle.trim(),
                          url: editLinkUrl.trim(),
                        });
                        setCreatorLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
                        setEditingLinkId(null);
                      } catch {
                        // ignore
                      } finally {
                        setLinkBusy(false);
                      }
                    }}
                  >
                    <Text style={styles.linkBtnText}>{linkBusy ? "Saving..." : "Save"}</Text>
                  </Pressable>
                  <Pressable onPress={() => setEditingLinkId(null)}>
                    <Text style={styles.hintText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.hintText} numberOfLines={1}>
                    {link.url}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setEditingLinkId(link.id);
                    setEditLinkTitle(link.title);
                    setEditLinkUrl(link.url);
                  }}
                >
                  <Text style={styles.linkBtnText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await api.deleteCreatorLink(link.id);
                    setCreatorLinks((prev) => prev.filter((l) => l.id !== link.id));
                  }}
                >
                  <Text style={styles.errorText}>Remove</Text>
                </Pressable>
              </>
            )}
          </View>
        ))}
        {creatorLinks.length < 8 ? (
          <>
            <TextInput
              value={linkTitle}
              onChangeText={setLinkTitle}
              placeholder="Link title"
              style={styles.input}
              placeholderTextColor={colors.textFaint}
            />
            <TextInput
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://..."
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor={colors.textFaint}
            />
            <Pressable
              style={styles.updateBtn}
              disabled={linkBusy}
              onPress={async () => {
                if (!linkTitle.trim() || !linkUrl.trim()) return;
                setLinkBusy(true);
                try {
                  const created = await api.createCreatorLink({ title: linkTitle.trim(), url: linkUrl.trim() });
                  setCreatorLinks((prev) => [...prev, created]);
                  setLinkTitle("");
                  setLinkUrl("");
                } catch {
                  // ignore
                } finally {
                  setLinkBusy(false);
                }
              }}
            >
              <Text style={styles.updateBtnText}>{linkBusy ? "Adding..." : "Add link"}</Text>
            </Pressable>
          </>
        ) : null}

        <SectionTitle>Scene tags</SectionTitle>
        <View style={styles.optionRow}>
          {SCENE_TAGS.map((tag) => {
            const selected = (settings.sceneTags ?? []).includes(tag.id);
            return (
              <Pressable
                key={tag.id}
                onPress={() => {
                  const current = settings.sceneTags ?? [];
                  const next = selected ? current.filter((t) => t !== tag.id) : [...current, tag.id];
                  setSettings({ ...settings, sceneTags: next });
                }}
                style={[styles.optionChip, selected && styles.optionChipActive]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextActive]}>{tag.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>Privacy</SectionTitle>
        <OptionRow
          label="Profile visibility"
          value={settings.profileVisibility}
          onChange={(v) => setSettings({ ...settings, profileVisibility: v })}
          options={[
            { value: "public", label: "Public profile" },
            { value: "followers", label: "Followers only" },
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
            { value: "everyone", label: "Anyone can message me" },
            { value: "following", label: "People I follow" },
            { value: "none", label: "No one" },
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
        <ToggleRow label="Activity alerts (likes & comments)" value={settings.activityAlerts} onChange={(v) => setSettings({ ...settings, activityAlerts: v })} />
        <ToggleRow label="Message alerts" value={settings.messageAlerts} onChange={(v) => setSettings({ ...settings, messageAlerts: v })} />
        <ToggleRow label="Meet reminders" value={settings.meetReminders} onChange={(v) => setSettings({ ...settings, meetReminders: v })} />
        <ToggleRow label="Marketplace & trade alerts" value={settings.marketplaceAlerts ?? true} onChange={(v) => setSettings({ ...settings, marketplaceAlerts: v })} />
        <ToggleRow label="Weekly digest email" value={settings.weeklyDigest ?? true} onChange={(v) => setSettings({ ...settings, weeklyDigest: v })} />
        <Text style={styles.fieldLabel}>Quiet hours start</Text>
        <TextInput
          value={quietStart}
          onChangeText={setQuietStart}
          placeholder="22:00"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>Quiet hours end</Text>
        <TextInput
          value={quietEnd}
          onChangeText={setQuietEnd}
          placeholder="07:00"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
        <Text style={styles.hintText}>Push notifications are suppressed during quiet hours.</Text>

        <SectionTitle>Crew list</SectionTitle>
        <Text style={styles.hintText}>
          Your inner circle — crew-only Pit Updates are visible to people on this list.
        </Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput
            value={crewQuery}
            onChangeText={setCrewQuery}
            placeholder="Search @username to add…"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => {
              const username = crewQuery.trim().replace(/^@+/, "");
              if (username.length < 2 || crewBusy) return;
              setCrewBusy(true);
              api
                .addCrewMember(username)
                .then((d) => {
                  setCrewMembers(d.members ?? []);
                  setCrewQuery("");
                  setCrewSuggestions([]);
                })
                .catch((e) => Alert.alert("Crew", e instanceof Error ? e.message : "Couldn’t add"))
                .finally(() => setCrewBusy(false));
            }}
          />
          <Pressable
            disabled={crewBusy || crewQuery.trim().replace(/^@+/, "").length < 2}
            onPress={() => {
              const username = crewQuery.trim().replace(/^@+/, "");
              if (username.length < 2) return;
              setCrewBusy(true);
              api
                .addCrewMember(username)
                .then((d) => {
                  setCrewMembers(d.members ?? []);
                  setCrewQuery("");
                  setCrewSuggestions([]);
                })
                .catch((e) => Alert.alert("Crew", e instanceof Error ? e.message : "Couldn’t add"))
                .finally(() => setCrewBusy(false));
            }}
            style={[styles.saveBtn, { paddingHorizontal: 16, paddingVertical: 12, opacity: crewBusy || crewQuery.trim().replace(/^@+/, "").length < 2 ? 0.5 : 1 }]}
          >
            <Text style={styles.saveBtnText}>{crewBusy ? "…" : "Add"}</Text>
          </Pressable>
        </View>
        {crewSuggestions.length > 0 ? (
          <View style={styles.crewSuggestions}>
            {crewSuggestions.map((u) => (
              <Pressable
                key={u.id}
                disabled={crewBusy}
                onPress={() => {
                  setCrewBusy(true);
                  api
                    .addCrewMember(u.username)
                    .then((d) => {
                      setCrewMembers(d.members ?? []);
                      setCrewQuery("");
                      setCrewSuggestions([]);
                    })
                    .catch((e) => Alert.alert("Crew", e instanceof Error ? e.message : "Couldn’t add"))
                    .finally(() => setCrewBusy(false));
                }}
                style={styles.crewSuggestionRow}
              >
                <Text style={styles.savedName}>{u.displayName}</Text>
                <Text style={styles.hintText}>@{u.username}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {crewMembers.length === 0 ? (
          <Text style={styles.hintText}>No crew members yet. Add close friends who should see WIP pits.</Text>
        ) : (
          crewMembers.map((member) => (
            <View key={member.userId} style={styles.savedRow}>
              <View>
                <Text style={styles.savedName}>{member.displayName}</Text>
                <Text style={styles.hintText}>@{member.username}</Text>
              </View>
              <Pressable
                disabled={crewBusy}
                onPress={() => {
                  setCrewBusy(true);
                  api
                    .removeCrewMember(member.userId)
                    .then((d) => setCrewMembers(d.members ?? []))
                    .finally(() => setCrewBusy(false));
                }}
              >
                <Text style={styles.linkText}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}

        <SectionTitle>Muted &amp; blocked</SectionTitle>
        {mutedUsers.length === 0 ? (
          <Text style={styles.hintText}>No muted users</Text>
        ) : (
          mutedUsers.map((u) => (
            <View key={u.id} style={styles.savedRow}>
              <Text style={styles.savedName}>@{u.username}</Text>
              <Pressable onPress={() => api.unmuteUser(u.id).then(() => setMutedUsers((p) => p.filter((x) => x.id !== u.id)))}>
                <Text style={styles.linkText}>Unmute</Text>
              </Pressable>
            </View>
          ))
        )}
        {blockedUsers.length === 0 ? (
          <Text style={styles.hintText}>No blocked users</Text>
        ) : (
          blockedUsers.map((u) => (
            <View key={u.id} style={styles.savedRow}>
              <Text style={styles.savedName}>@{u.username}</Text>
              <Pressable onPress={() => api.unblockUser(u.id).then(() => setBlockedUsers((p) => p.filter((x) => x.id !== u.id)))}>
                <Text style={styles.linkText}>Unblock</Text>
              </Pressable>
            </View>
          ))
        )}

        <SectionTitle>Creator &amp; media</SectionTitle>
        <ToggleRow
          label="Always watermark exports"
          value={settings.alwaysWatermarkExports ?? false}
          onChange={(v) => setSettings({ ...settings, alwaysWatermarkExports: v })}
        />
        <ToggleRow
          label="Always blur plates"
          value={settings.alwaysBlurPlates ?? false}
          onChange={(v) => setSettings({ ...settings, alwaysBlurPlates: v })}
        />

        <SectionTitle>Discovery</SectionTitle>
        <Text style={styles.fieldLabel}>Near You radius (miles)</Text>
        <TextInput
          value={String(settings.nearYouRadius ?? 50)}
          onChangeText={(v) => setSettings({ ...settings, nearYouRadius: Number(v) || 50 })}
          keyboardType="number-pad"
          style={styles.input}
          placeholderTextColor={colors.textFaint}
        />

        <SectionTitle>Invite friends</SectionTitle>
        <Text style={styles.hintText}>Share your referral link. New signups can include your username.</Text>
        {(() => {
          const { current, next, progress, remaining } = referralTierProgress(referralCount);
          return (
            <View style={styles.referralBlock}>
              <Text style={styles.referralCount}>
                {referralCount} referral{referralCount === 1 ? "" : "s"}
                {current ? ` · ${current.emoji} ${current.label}` : ""}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              {next ? (
                <Text style={styles.hintText}>{remaining} more to {next.label}</Text>
              ) : (
                <Text style={styles.hintText}>Max referral tier reached</Text>
              )}
            </View>
          );
        })()}
        <Pressable
          style={styles.linkBtn}
          onPress={async () => {
            const url = `${API_URL.replace(/\/$/, "")}/auth/signup?ref=${profile.username}`;
            await Share.share({ message: url });
            setReferralCopied(true);
            setTimeout(() => setReferralCopied(false), 2000);
          }}
        >
          <Text style={styles.linkBtnText}>{referralCopied ? "Link shared!" : "Share referral link"}</Text>
        </Pressable>

        <SectionTitle>Pro Garage</SectionTitle>
        {profile.isPro ? (
          <>
            <Text style={styles.hintText}>
              Pro active{profile.proExpiresAt ? ` until ${new Date(profile.proExpiresAt).toLocaleDateString()}` : ""}
            </Text>
            <Text style={styles.fieldLabel}>Custom garage URL</Text>
            <View style={styles.slugRow}>
              <Text style={styles.slugPrefix}>/garage/u/</Text>
              <TextInput
                value={garageSlugDraft}
                onChangeText={(v) => setGarageSlugDraft(v.toLowerCase())}
                style={[styles.input, { flex: 1 }]}
                placeholder="my-builds"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="none"
              />
            </View>
            <Pressable
              style={styles.linkBtn}
              disabled={proLoading}
              onPress={async () => {
                setProLoading(true);
                setProMessage("");
                try {
                  const data = await api.setGarageSlug(garageSlugDraft);
                  setProfile({ ...profile, garageSlug: data.garageSlug });
                  setProMessage("Garage URL updated.");
                } catch (e) {
                  setProMessage(e instanceof Error ? e.message : "Could not save slug");
                } finally {
                  setProLoading(false);
                }
              }}
            >
              <Text style={styles.linkBtnText}>{proLoading ? "Saving..." : "Save garage URL"}</Text>
            </Pressable>
            {analytics ? (
              <View style={{ gap: 8 }}>
                <View style={styles.analyticsRow}>
                  <View style={styles.analyticsCell}>
                    <Text style={styles.analyticsValue}>{analytics.profileViews}</Text>
                    <Text style={styles.hintText}>Views</Text>
                  </View>
                  <View style={styles.analyticsCell}>
                    <Text style={styles.analyticsValue}>{analytics.vehicleCount}</Text>
                    <Text style={styles.hintText}>Vehicles</Text>
                  </View>
                  <View style={styles.analyticsCell}>
                    <Text style={styles.analyticsValue}>${analytics.modSpendTotal.toLocaleString()}</Text>
                    <Text style={styles.hintText}>Mod spend</Text>
                  </View>
                </View>
                <View style={styles.analyticsRow}>
                  <View style={styles.analyticsCell}>
                    <Text style={styles.analyticsValue}>{analytics.postSaves ?? 0}</Text>
                    <Text style={styles.hintText}>Post saves</Text>
                  </View>
                  <View style={styles.analyticsCell}>
                    <Text style={styles.analyticsValue}>{analytics.listingClicks ?? 0}</Text>
                    <Text style={styles.hintText}>Listing saves</Text>
                  </View>
                  <View style={styles.analyticsCell}>
                    <Text style={styles.analyticsValue}>{analytics.totalReactions ?? 0}</Text>
                    <Text style={styles.hintText}>Reactions</Text>
                  </View>
                </View>
                {analytics.reactions && Object.keys(analytics.reactions).length > 0 ? (
                  <View style={styles.reactionBreakdown}>
                    <Text style={styles.hintText}>Reaction breakdown</Text>
                    <View style={styles.optionRow}>
                      {Object.entries(analytics.reactions)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <View key={type} style={styles.reactionChip}>
                            <Text style={styles.reactionChipText}>
                              {type}: {count}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.hintText}>Custom garage URL, analytics, ad-free placeholder, and priority support.</Text>
            <Pressable
              style={styles.accentBtn}
              disabled={proLoading}
              onPress={async () => {
                setProLoading(true);
                setProMessage("");
                try {
                  const data = await api.activateProTrial();
                  setProfile({
                    ...profile,
                    isPro: true,
                    proExpiresAt: data.pro?.proExpiresAt ?? null,
                  });
                  setProMessage("Pro trial activated for 30 days.");
                  const stats = await api.getGarageAnalytics();
                  setAnalytics(stats);
                } catch (e) {
                  setProMessage(e instanceof Error ? e.message : "Activation failed");
                } finally {
                  setProLoading(false);
                }
              }}
            >
              <Text style={styles.accentBtnText}>{proLoading ? "Activating..." : "Start 30-day Pro trial (demo)"}</Text>
            </Pressable>
          </>
        )}
        {proMessage ? <Text style={styles.hintText}>{proMessage}</Text> : null}

        <SectionTitle>Marketplace</SectionTitle>
        <Pressable
          style={styles.linkBtn}
          disabled={profile.verifiedSeller}
          onPress={async () => {
            try {
              await api.requestVerifiedSeller();
              setSellerMessage("Request submitted for admin review.");
            } catch (e) {
              setSellerMessage(e instanceof Error ? e.message : "Request failed");
            }
          }}
        >
          <Text style={styles.linkBtnText}>{profile.verifiedSeller ? "Verified seller" : "Request verified seller"}</Text>
        </Pressable>
        {sellerMessage ? <Text style={styles.hintText}>{sellerMessage}</Text> : null}
        <Pressable
          style={styles.linkBtn}
          disabled={profile.isVerifiedShop}
          onPress={async () => {
            try {
              await api.requestVerifiedShop();
              setShopMessage("Request submitted for admin review.");
            } catch (e) {
              setShopMessage(e instanceof Error ? e.message : "Request failed");
            }
          }}
        >
          <Text style={styles.linkBtnText}>{profile.isVerifiedShop ? "Verified shop" : "Request verified shop"}</Text>
        </Pressable>
        {shopMessage ? <Text style={styles.hintText}>{shopMessage}</Text> : null}

        <SectionTitle>Primary ride</SectionTitle>
        <Text style={styles.hintText}>Featured on your profile header</Text>
        <View style={styles.optionRow}>
          <Pressable
            onPress={async () => {
              setPrimaryVehicleId(null);
              await api.setPrimaryVehicle(null);
            }}
            style={[styles.optionChip, primaryVehicleId == null && styles.optionChipActive]}
          >
            <Text style={[styles.optionText, primaryVehicleId == null && styles.optionTextActive]}>None selected</Text>
          </Pressable>
          {vehicles.map((v) => (
            <Pressable
              key={v.id}
              onPress={async () => {
                setPrimaryVehicleId(v.id);
                await api.setPrimaryVehicle(v.id);
              }}
              style={[styles.optionChip, primaryVehicleId === v.id && styles.optionChipActive]}
            >
              <Text style={[styles.optionText, primaryVehicleId === v.id && styles.optionTextActive]}>
                {v.year} {v.make}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle>Appearance</SectionTitle>
        <OptionRow
          label="Theme"
          value={settings.theme}
          onChange={(v) => setSettings({ ...settings, theme: v })}
          options={[
            { value: "dark", label: "Dark (GearNet default)" },
            { value: "light", label: "Light" },
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
        <Text style={styles.dangerHint}>
          Permanently delete your account, garage, posts, and messages. This cannot be undone.
        </Text>
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

        <SectionTitle>Session</SectionTitle>
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
  referralBlock: { gap: 8, marginBottom: spacing.sm },
  referralCount: { color: colors.text, fontSize: 14, fontWeight: "600" },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 999 },
  pushBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    alignItems: "center",
  },
  pushBtnText: { color: colors.textMuted, fontSize: 13 },
  accentBtn: {
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    alignItems: "center",
  },
  accentBtnText: { color: colors.accentText, fontSize: 14, fontWeight: "600" },
  slugRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  slugPrefix: { color: colors.textDim, fontSize: 12 },
  analyticsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  analyticsCell: { flex: 1, alignItems: "center" },
  analyticsValue: { color: colors.text, fontSize: 18, fontWeight: "700" },
  reactionBreakdown: { gap: 6, marginTop: 4 },
  reactionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.card,
  },
  reactionChipText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: 8,
  },
  linkTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
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
  optionTextActive: { color: colors.accent, fontWeight: "600" },
  linkText: { fontSize: 13, color: colors.accent, fontWeight: "600" },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    marginBottom: 8,
  },
  crewSuggestions: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    overflow: "hidden",
    marginBottom: 8,
  },
  crewSuggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardMuted,
  },
  savedName: { fontSize: 14, color: colors.text },
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
