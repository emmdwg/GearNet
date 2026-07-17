"use client";

import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { CoverPicker } from "@/components/ui/CoverPicker";
import { PrimaryRideSelector } from "@/components/profile/PrimaryRideSelector";
import { InstallAppPanel } from "@/components/pwa/InstallAppPrompt";
import { CrewListPanel } from "@/components/settings/CrewListPanel";
import { PushRegistration } from "@/components/settings/PushRegistration";
import { CreatorLinksEditor } from "@/components/settings/CreatorLinksEditor";
import { ReferralProgressBar } from "@/components/settings/ReferralProgressBar";
import { persistThemeChoice } from "@/components/settings/ThemeApplier";
import { useAuth } from "@/lib/auth-context";
import { setStoredNearYouRadius } from "@/lib/near-you-radius";
import { SCENE_TAGS } from "@/lib/scene-tags";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SettingsData = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  activityAlerts: boolean;
  messageAlerts: boolean;
  meetReminders: boolean;
  marketplaceAlerts: boolean;
  weeklyDigest: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  nearYouRadius: number;
  profileVisibility: string;
  showLocation: boolean;
  showGarage: boolean;
  allowMessages: string;
  theme: string;
  sceneTags?: string[];
  alwaysWatermarkExports?: boolean;
  alwaysBlurPlates?: boolean;
};

type ProfileData = {
  username: string;
  displayName: string;
  email: string;
  bio: string;
  location: string;
  avatar: string;
  coverImage?: string;
  usernameChangedAt?: string | null;
  isPro?: boolean;
  proExpiresAt?: string | null;
  garageSlug?: string | null;
  primaryVehicleId?: string | null;
  verifiedSeller?: boolean;
  isVerifiedShop?: boolean;
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-amber-500" />
    </label>
  );
}

export function SettingsContent() {
  const { user, signOut, refresh } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saved, setSaved] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameHint, setUsernameHint] = useState("");
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerMessage, setSellerMessage] = useState("");
  const [shopLoading, setShopLoading] = useState(false);
  const [shopMessage, setShopMessage] = useState("");
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
  const [mutedUsers, setMutedUsers] = useState<{ id: string; username: string; displayName: string }[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; username: string; displayName: string }[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin?callbackUrl=/settings");
      return;
    }
    setLoadError("");
    fetch("/api/settings")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Couldn’t load settings");
        setSettings(data.settings);
        setProfile(data.profile);
        setUsernameDraft(data.profile.username);
        setGarageSlugDraft(data.profile.garageSlug ?? "");
        if (data.profile.isPro) {
          fetch("/api/garage/analytics")
            .then((res) => (res.ok ? res.json() : null))
            .then((d) => d && setAnalytics(d))
            .catch(() => {});
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Couldn’t load settings");
      })
      .finally(() => setLoading(false));

    fetch("/api/settings/username")
      .then((r) => r.json())
      .then((d) => {
        if (d.nextChangeAt) {
          setUsernameHint(`Next change available ${new Date(d.nextChangeAt).toLocaleDateString()}`);
        }
      })
      .catch(() => {});

    fetch("/api/users/me/referrals")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setReferralCount(d.referralCount ?? 0);
      })
      .catch(() => {});
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/users/muted")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMutedUsers(Array.isArray(data) ? data : []))
      .catch(() => setMutedUsers([]));
    fetch("/api/users/blocked")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBlockedUsers(Array.isArray(data) ? data : []))
      .catch(() => setBlockedUsers([]));
  }, [user]);

  async function unmuteUser(userId: string) {
    try {
      const res = await fetch(`/api/users/mute/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        setSaved("Couldn’t unmute user");
        setTimeout(() => setSaved(""), 3000);
        return;
      }
      setMutedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setSaved("Couldn’t unmute user");
      setTimeout(() => setSaved(""), 3000);
    }
  }

  async function unblockUser(userId: string) {
    try {
      const res = await fetch(`/api/users/block?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      if (!res.ok) {
        setSaved("Couldn’t unblock user");
        setTimeout(() => setSaved(""), 3000);
        return;
      }
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setSaved("Couldn’t unblock user");
      setTimeout(() => setSaved(""), 3000);
    }
  }

  async function saveAvatar(avatar: string) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { avatar } }),
    });
    if (res.ok) {
      await refresh();
      setSaved("Avatar updated");
      setTimeout(() => setSaved(""), 2000);
    } else {
      setSaved("Couldn’t update avatar");
      setTimeout(() => setSaved(""), 3000);
    }
  }

  async function saveCover(coverImage: string) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { coverImage } }),
    });
    if (res.ok) {
      await refresh();
      setSaved("Cover updated");
      setTimeout(() => setSaved(""), 2000);
    } else {
      setSaved("Couldn’t update cover");
      setTimeout(() => setSaved(""), 3000);
    }
  }

  async function saveUsername() {
    setUsernameError("");
    const res = await fetch("/api/settings/username", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameDraft }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUsernameError(data.error ?? "Could not update username");
      return;
    }
    setProfile({ ...profile!, username: data.username });
    await refresh();
    setSaved("Username updated");
    setTimeout(() => setSaved(""), 2000);
  }

  async function save() {
    if (!settings || !profile) return;
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings, profile }),
    });
    if (res.ok) {
      if (settings.theme) persistThemeChoice(settings.theme);
      if (settings.nearYouRadius) setStoredNearYouRadius(settings.nearYouRadius);
      await refresh();
      setSaved("Settings saved");
      setTimeout(() => setSaved(""), 2000);
    } else {
      const data = await res.json().catch(() => ({}));
      setSaved(data.error || "Couldn’t save settings");
      setTimeout(() => setSaved(""), 3000);
    }
  }

  async function copyReferralLink() {
    if (!profile) return;
    const url = `${window.location.origin}/auth/signup?ref=${profile.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function requestVerifiedShop() {
    setShopLoading(true);
    setShopMessage("");
    try {
      const res = await fetch("/api/settings/verified-shop", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setShopMessage("Request submitted for admin review.");
    } catch (err) {
      setShopMessage(err instanceof Error ? err.message : "Request failed");
    } finally {
      setShopLoading(false);
    }
  }

  async function activateProTrial() {
    setProLoading(true);
    setProMessage("");
    try {
      const res = await fetch("/api/settings/pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trial" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Activation failed");
      setProfile({ ...profile!, isPro: true, proExpiresAt: data.pro?.proExpiresAt ?? null });
      setProMessage("Pro trial activated for 30 days.");
      const analyticsRes = await fetch("/api/garage/analytics");
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch (err) {
      setProMessage(err instanceof Error ? err.message : "Activation failed");
    } finally {
      setProLoading(false);
    }
  }

  async function saveGarageSlug() {
    setProLoading(true);
    setProMessage("");
    try {
      const res = await fetch("/api/settings/pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setSlug", garageSlug: garageSlugDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save slug");
      setProfile({ ...profile!, garageSlug: data.garageSlug });
      setProMessage("Garage URL updated.");
    } catch (err) {
      setProMessage(err instanceof Error ? err.message : "Could not save slug");
    } finally {
      setProLoading(false);
    }
  }

  async function requestVerifiedSeller() {
    setSellerLoading(true);
    setSellerMessage("");
    try {
      const res = await fetch("/api/settings/verified-seller", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setSellerMessage("Request submitted for admin review.");
    } catch (err) {
      setSellerMessage(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSellerLoading(false);
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

    const supabase = createClient();
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
    if (deleteConfirm !== profile?.username) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE", username: profile.username }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not delete account");
      }
      await signOut();
      router.push("/explore");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-center text-zinc-500">Loading settings...</p>;
  }

  if (loadError || !settings || !profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-400">{loadError || "Couldn’t load settings"}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-amber-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-zinc-500">Account, privacy & notifications</p>
      </div>

      <AvatarPicker
        value={profile.avatar ?? ""}
        onChange={(avatar) => {
          setProfile({ ...profile, avatar });
          saveAvatar(avatar);
        }}
        label="Tap to change photo"
        uploadOnPick
      />
      <CoverPicker
        value={profile.coverImage ?? ""}
        onChange={(coverImage) => {
          setProfile({ ...profile, coverImage });
          saveCover(coverImage);
        }}
      />

      <section id="home-area" className="section-card space-y-4 scroll-mt-24">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile</h2>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Username</label>
          <div className="flex gap-2">
            <input
              value={usernameDraft}
              onChange={(e) => setUsernameDraft(e.target.value.toLowerCase())}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={saveUsername}
              disabled={usernameDraft === profile.username}
              className="rounded-xl border border-zinc-700 px-4 text-sm text-zinc-300 hover:border-amber-500/40 disabled:opacity-40"
            >
              Update
            </button>
          </div>
          {usernameHint ? <p className="mt-1 text-xs text-zinc-500">{usernameHint}</p> : null}
          {usernameError ? <p className="mt-1 text-xs text-red-400">{usernameError}</p> : null}
        </div>
        <input
          value={profile.displayName}
          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
          placeholder="Display name"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
        />
        <input value={profile.email} disabled className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white opacity-60" />
        <input
          value={profile.bio ?? ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Bio"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
        />
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Home area (city)</label>
          <input
            value={profile.location ?? ""}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            placeholder="e.g. Edmonton, AB"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Default for Near You, Meets, and Exchange when GPS is off. Save Changes below to apply.
          </p>
        </div>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Scene tags</h2>
        <div className="flex flex-wrap gap-2">
          {SCENE_TAGS.map((tag) => {
            const active = (settings.sceneTags ?? []).includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  const current = settings.sceneTags ?? [];
                  setSettings({
                    ...settings,
                    sceneTags: active ? current.filter((t) => t !== tag.id) : [...current, tag.id],
                  });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-amber-500 text-zinc-950"
                    : "border border-zinc-700 text-zinc-400 hover:text-white"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Privacy</h2>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Profile visibility</label>
          <select
            value={settings.profileVisibility}
            onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
          >
            <option value="public">Public profile</option>
            <option value="followers">Followers only</option>
            <option value="private">Private</option>
          </select>
        </div>
        <Toggle label="Show location on profile" checked={settings.showLocation} onChange={(v) => setSettings({ ...settings, showLocation: v })} />
        <Toggle label="Show garage publicly" checked={settings.showGarage} onChange={(v) => setSettings({ ...settings, showGarage: v })} />
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Messages</label>
          <select
            value={settings.allowMessages}
            onChange={(e) => setSettings({ ...settings, allowMessages: e.target.value })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
          >
            <option value="everyone">Anyone can message me</option>
            <option value="following">People I follow</option>
            <option value="none">No one</option>
          </select>
        </div>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Notifications</h2>
        <Toggle label="Email notifications" checked={settings.emailNotifications} onChange={(v) => setSettings({ ...settings, emailNotifications: v })} />
        <Toggle label="Push notifications" checked={settings.pushNotifications} onChange={(v) => setSettings({ ...settings, pushNotifications: v })} />
        <PushRegistration
          enabled={settings.pushNotifications}
          onEnabledChange={(v) => setSettings({ ...settings, pushNotifications: v })}
        />
        <Toggle label="Activity alerts (likes & comments)" checked={settings.activityAlerts} onChange={(v) => setSettings({ ...settings, activityAlerts: v })} />
        <Toggle label="Message alerts" checked={settings.messageAlerts} onChange={(v) => setSettings({ ...settings, messageAlerts: v })} />
        <Toggle
          label="Meet reminders"
          description="Push/in-app reminders the day before and morning of meets you’ve RSVP’d to"
          checked={settings.meetReminders}
          onChange={(v) => setSettings({ ...settings, meetReminders: v })}
        />
        <Toggle label="Marketplace & trade alerts" checked={settings.marketplaceAlerts ?? true} onChange={(v) => setSettings({ ...settings, marketplaceAlerts: v })} />
        <Toggle label="Weekly digest email" checked={settings.weeklyDigest ?? true} onChange={(v) => setSettings({ ...settings, weeklyDigest: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Quiet hours start</label>
            <input
              type="time"
              value={settings.quietHoursStart ?? ""}
              onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Quiet hours end</label>
            <input
              type="time"
              value={settings.quietHoursEnd ?? ""}
              onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
            />
          </div>
        </div>
        <p className="text-xs text-zinc-500">Push notifications are suppressed during quiet hours.</p>
      </section>

      <section id="crew" className="section-card space-y-3 scroll-mt-24">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Crew list</h2>
        <CrewListPanel />
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Muted &amp; blocked</h2>
        {mutedUsers.length === 0 ? (
          <p className="text-sm text-zinc-600">No muted users</p>
        ) : (
          <ul className="space-y-2">
            {mutedUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                <p className="text-sm text-white">@{u.username}</p>
                <button type="button" onClick={() => void unmuteUser(u.id)} className="text-xs text-amber-400 hover:underline">
                  Unmute
                </button>
              </li>
            ))}
          </ul>
        )}
        {blockedUsers.length === 0 ? (
          <p className="text-sm text-zinc-600">No blocked users</p>
        ) : (
          <ul className="space-y-2">
            {blockedUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                <p className="text-sm text-white">@{u.username}</p>
                <button type="button" onClick={() => void unblockUser(u.id)} className="text-xs text-amber-400 hover:underline">
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Creator &amp; media</h2>
        <Toggle
          label="Always watermark exports"
          checked={settings.alwaysWatermarkExports ?? false}
          onChange={(v) => setSettings({ ...settings, alwaysWatermarkExports: v })}
        />
        <Toggle
          label="Always blur plates"
          checked={settings.alwaysBlurPlates ?? false}
          onChange={(v) => setSettings({ ...settings, alwaysBlurPlates: v })}
        />
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Discovery</h2>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Near You radius (miles)</label>
          <input
            type="number"
            min={5}
            max={500}
            value={settings.nearYouRadius ?? 50}
            onChange={(e) => setSettings({ ...settings, nearYouRadius: Number(e.target.value) || 50 })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
          />
        </div>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Invite friends</h2>
        <p className="text-sm text-zinc-400">Share your referral link. New signups can include your username.</p>
        <ReferralProgressBar count={referralCount} />
        <CreatorLinksEditor />
        <button type="button" onClick={copyReferralLink} className="w-full rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-300 hover:border-amber-500/40">
          {referralCopied ? "Link shared!" : "Share referral link"}
        </button>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pro Garage</h2>
        {profile.isPro ? (
          <div className="space-y-3">
            <p className="text-sm text-amber-300">
              Pro active
              {profile.proExpiresAt ? ` until ${new Date(profile.proExpiresAt).toLocaleDateString()}` : ""}
            </p>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Custom garage URL</label>
              <div className="flex gap-2">
                <span className="flex items-center rounded-l-xl border border-r-0 border-zinc-800 bg-zinc-950/60 px-3 text-xs text-zinc-500">
                  /garage/u/
                </span>
                <input
                  value={garageSlugDraft}
                  onChange={(e) => setGarageSlugDraft(e.target.value.toLowerCase())}
                  placeholder="my-builds"
                  className="flex-1 rounded-r-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={saveGarageSlug}
                  disabled={proLoading}
                  className="rounded-xl border border-zinc-700 px-4 text-sm text-zinc-300 hover:border-amber-500/40 disabled:opacity-50"
                >
                  Save garage URL
                </button>
              </div>
            </div>
            {analytics ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-center text-sm">
                  <div>
                    <p className="text-lg font-bold text-white">{analytics.profileViews}</p>
                    <p className="text-xs text-zinc-500">Profile views</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{analytics.vehicleCount}</p>
                    <p className="text-xs text-zinc-500">Vehicles</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">${analytics.modSpendTotal.toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">Mod spend</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-center text-sm">
                  <div>
                    <p className="text-lg font-bold text-white">{analytics.postSaves ?? 0}</p>
                    <p className="text-xs text-zinc-500">Post saves</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{analytics.listingClicks ?? 0}</p>
                    <p className="text-xs text-zinc-500">Listing saves</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{analytics.totalReactions ?? 0}</p>
                    <p className="text-xs text-zinc-500">Reactions</p>
                  </div>
                </div>
                {analytics.reactions && Object.keys(analytics.reactions).length > 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Reaction breakdown
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(analytics.reactions)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <span
                            key={type}
                            className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
                          >
                            {type}: <span className="font-semibold text-white">{count}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-400">
              Custom garage URL, analytics, ad-free placeholder, and priority support.
            </p>
            <button
              type="button"
              onClick={activateProTrial}
              disabled={proLoading}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 py-2.5 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50"
            >
              {proLoading ? "Activating..." : "Start 30-day Pro trial (demo)"}
            </button>
          </>
        )}
        {proMessage ? <p className="text-xs text-zinc-400">{proMessage}</p> : null}
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Marketplace</h2>
        <button
          type="button"
          onClick={requestVerifiedSeller}
          disabled={sellerLoading || profile.verifiedSeller}
          className="w-full rounded-lg border border-amber-500/40 py-2.5 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
        >
          {profile.verifiedSeller ? "Verified seller" : sellerLoading ? "Submitting..." : "Request verified seller"}
        </button>
        {sellerMessage ? <p className="text-xs text-zinc-400">{sellerMessage}</p> : null}
        <button
          type="button"
          onClick={requestVerifiedShop}
          disabled={shopLoading || profile.isVerifiedShop}
          className="w-full rounded-lg border border-amber-500/40 py-2.5 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
        >
          {profile.isVerifiedShop ? "Verified shop" : shopLoading ? "Submitting..." : "Request verified shop"}
        </button>
        {shopMessage ? <p className="text-xs text-zinc-400">{shopMessage}</p> : null}
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Primary ride</h2>
        <PrimaryRideSelector currentId={profile.primaryVehicleId} />
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Appearance</h2>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => {
              const theme = e.target.value;
              setSettings({ ...settings, theme });
              persistThemeChoice(theme);
            }}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
          >
            <option value="dark">Dark (GearNet default)</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>
      </section>

      <button type="button" onClick={save} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-300">
        Save Changes
      </button>
      {saved ? (
        <p className={`text-center text-sm ${saved.startsWith("Could") ? "text-red-400" : "text-emerald-400"}`}>
          {saved}
        </p>
      ) : null}

      <section id="install" className="section-card space-y-3 scroll-mt-24">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Install app</h2>
        <p className="text-sm text-zinc-500">
          Add GearNet to your home screen — free, no App Store.
        </p>
        <InstallAppPanel />
        <Link
          href="/install"
          className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
        >
          Full install guide
        </Link>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Account security</h2>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={changePassword}
          disabled={!newPassword || !confirmPassword}
          className="w-full rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-300 hover:border-amber-500/40 disabled:opacity-40"
        >
          Update password
        </button>
        {passwordError ? <p className="text-xs text-red-400">{passwordError}</p> : null}
        {passwordMessage ? <p className="text-xs text-emerald-400">{passwordMessage}</p> : null}
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick links</h2>
        <Link
          href={`/profile/${profile.username}`}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
        >
          View public profile
        </Link>
      </section>

      <section className="section-card space-y-3 border-red-500/20">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400">Danger zone</h2>
        <p className="text-sm text-zinc-500">
          Permanently delete your account, garage, posts, and messages. This cannot be undone.
        </p>
        <input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder={`Type ${profile.username} to confirm`}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-red-500/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={deleteAccount}
          disabled={deleting || deleteConfirm !== profile.username}
          className="w-full rounded-lg border border-red-500/40 py-2.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-40"
        >
          {deleting ? "Deleting..." : "Delete account"}
        </button>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Session</h2>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/explore");
          }}
          className="w-full rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Sign out
        </button>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">About</h2>
        <Link href="/terms" className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white">
          Terms of Service
        </Link>
        <Link href="/privacy" className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white">
          Privacy Policy
        </Link>
      </section>
    </div>
  );
}
