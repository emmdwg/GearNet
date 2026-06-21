"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/auth/signin?verified=1");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
        <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
          <p className="text-zinc-400">Open the reset link from your email to continue.</p>
          <Link href="/auth/forgot-password" className="mt-4 inline-block text-sm text-amber-400 hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <Zap className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Choose a new password</h1>
            <p className="text-sm text-zinc-500">At least 8 characters</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p> : null}
          <div>
            <label className="mb-1 block text-sm text-zinc-400">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-400 hover:to-amber-300 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
