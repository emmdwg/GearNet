"use client";

import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, normalizePhone } from "@/lib/auth-errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Zap } from "lucide-react";

type Mode = "email" | "phone";

export default function SignUpPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("email");
  const [form, setForm] = useState({ email: "", password: "", username: "", displayName: "", phone: "", otp: "", avatar: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        username: form.username,
        displayName: form.displayName,
        avatar: form.avatar || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    await supabase.auth.resend({
      type: "signup",
      email: form.email,
      options: { emailRedirectTo: `${appUrl}/auth/callback` },
    });

    router.push(`/auth/verify?email=${encodeURIComponent(form.email)}`);
  }

  async function sendPhoneOtp() {
    setLoading(true);
    setError("");
    try {
      const phone = normalizePhone(form.phone);
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
      if (otpError) throw new Error(otpError.message);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification code");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const phone = normalizePhone(form.phone);
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: form.otp,
        type: "sms",
      });
      if (verifyError || !data.session) throw new Error(verifyError?.message ?? "Invalid verification code");

      const profileRes = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          username: form.username,
          displayName: form.displayName,
          phone,
          avatar: form.avatar || undefined,
        }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error ?? "Profile setup failed");

      router.push("/explore");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <Zap className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Join GearNet</h1>
            <p className="text-sm text-zinc-500">Your digital garage starts here</p>
          </div>
        </div>

        <AvatarPicker
          value={form.avatar}
          onChange={(avatar) => setForm({ ...form, avatar })}
          label="Add a profile photo (optional)"
        />

        <div className="mb-5 mt-6 grid grid-cols-2 gap-1 rounded-xl bg-zinc-950/80 p-1">
          {(["email", "phone"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMode(tab);
                setError("");
              }}
              className={`rounded-md py-2 text-sm font-medium capitalize transition-colors ${
                mode === tab ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {mode === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
            {(["displayName", "username", "email", "password"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm capitalize text-zinc-400">
                  {field === "displayName" ? "Display Name" : field}
                </label>
                <input
                  type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  required
                  minLength={field === "password" ? 8 : undefined}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
            {(["displayName", "username"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm capitalize text-zinc-400">
                  {field === "displayName" ? "Display Name" : field}
                </label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Phone</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="5551234567"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={sendPhoneOtp}
                  disabled={loading || !form.phone}
                  className="shrink-0 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:border-zinc-600 disabled:opacity-50"
                >
                  {otpSent ? "Resend" : "Send code"}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                required
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !otpSent}
              className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-amber-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
