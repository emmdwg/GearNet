"use client";

import { useAuth } from "@/lib/auth-context";
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
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);

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
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  async function save() {
    if (!settings || !profile) return;
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings, profile }),
    });
    if (res.ok) {
      setSaved("Settings saved");
      setTimeout(() => setSaved(""), 2000);
    }
  }

  if (loading || !settings || !profile) {
    return <p className="p-8 text-center text-zinc-500">Loading settings...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500">Account, privacy, notifications, and preferences</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Account</h2>
        <input
          value={profile.displayName}
          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
          placeholder="Display name"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
        />
        <input value={profile.email} disabled className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white opacity-60" />
        <input
          value={profile.bio ?? ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Bio"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
        />
        <input
          value={profile.location ?? ""}
          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          placeholder="Location"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Privacy</h2>
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Notifications</h2>
        <Toggle label="Email notifications" checked={settings.emailNotifications} onChange={(v) => setSettings({ ...settings, emailNotifications: v })} />
        <Toggle label="Push notifications" checked={settings.pushNotifications} onChange={(v) => setSettings({ ...settings, pushNotifications: v })} />
        <Toggle label="Activity alerts (likes & comments)" checked={settings.activityAlerts} onChange={(v) => setSettings({ ...settings, activityAlerts: v })} />
        <Toggle label="Message alerts" checked={settings.messageAlerts} onChange={(v) => setSettings({ ...settings, messageAlerts: v })} />
        <Toggle label="Meet reminders" checked={settings.meetReminders} onChange={(v) => setSettings({ ...settings, meetReminders: v })} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Appearance</h2>
        <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white">
          <option value="dark">Dark (GearNet default)</option>
          <option value="system">System</option>
        </select>
      </section>

      <button type="button" onClick={save} className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 hover:bg-amber-400">
        Save Changes
      </button>
      {saved && <p className="text-center text-sm text-emerald-400">{saved}</p>}

      <section className="space-y-3 border-t border-zinc-800 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Account actions</h2>
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
