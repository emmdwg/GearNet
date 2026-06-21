"use client";

import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { CoverPicker } from "@/components/ui/CoverPicker";
import { PushRegistration } from "@/components/settings/PushRegistration";
import { useAuth } from "@/lib/auth-context";
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
  profileVisibility: string;
  showLocation: boolean;
  showGarage: boolean;
  allowMessages: string;
  theme: string;
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

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin?callbackUrl=/settings");
      return;
    }
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setProfile(data.profile);
        setUsernameDraft(data.profile.username);
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
  }, [user, router]);

  async function saveAvatar(avatar: string) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { avatar } }),
    });
    if (res.ok) await refresh();
  }

  async function saveCover(coverImage: string) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { coverImage } }),
    });
    if (res.ok) await refresh();
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
      await refresh();
      setSaved("Settings saved");
      setTimeout(() => setSaved(""), 2000);
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
      const res = await fetch("/api/account", { method: "DELETE" });
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

  if (loading || !settings || !profile) {
    return <p className="p-8 text-center text-zinc-500">Loading settings...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-zinc-500">Profile, privacy, and notifications</p>
      </div>

      <section className="section-card space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile</h2>
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
        <input
          value={profile.location ?? ""}
          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          placeholder="Location"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
        />
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Privacy</h2>
        <select
          value={settings.profileVisibility}
          onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
        >
          <option value="public">Public profile</option>
          <option value="followers">Followers only</option>
          <option value="private">Private</option>
        </select>
        <Toggle label="Show location on profile" checked={settings.showLocation} onChange={(v) => setSettings({ ...settings, showLocation: v })} />
        <Toggle label="Show garage publicly" checked={settings.showGarage} onChange={(v) => setSettings({ ...settings, showGarage: v })} />
        <select
          value={settings.allowMessages}
          onChange={(e) => setSettings({ ...settings, allowMessages: e.target.value })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
        >
          <option value="everyone">Anyone can message me</option>
          <option value="following">People I follow</option>
          <option value="none">No one</option>
        </select>
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Notifications</h2>
        <Toggle label="Email notifications" checked={settings.emailNotifications} onChange={(v) => setSettings({ ...settings, emailNotifications: v })} />
        <Toggle label="Push notifications" checked={settings.pushNotifications} onChange={(v) => setSettings({ ...settings, pushNotifications: v })} />
        <PushRegistration enabled={settings.pushNotifications} />
        <Toggle label="Activity alerts (likes & comments)" checked={settings.activityAlerts} onChange={(v) => setSettings({ ...settings, activityAlerts: v })} />
        <Toggle label="Message alerts" checked={settings.messageAlerts} onChange={(v) => setSettings({ ...settings, messageAlerts: v })} />
        <Toggle label="Meet reminders" checked={settings.meetReminders} onChange={(v) => setSettings({ ...settings, meetReminders: v })} />
      </section>

      <section className="section-card space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Appearance</h2>
        <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white">
          <option value="dark">Dark (GearNet default)</option>
          <option value="system">System</option>
        </select>
      </section>

      <button type="button" onClick={save} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-300">
        Save Changes
      </button>
      {saved && <p className="text-center text-sm text-emerald-400">{saved}</p>}

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
    </div>
  );
}
