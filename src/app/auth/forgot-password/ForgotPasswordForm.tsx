"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import { Zap } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Check your email for a password reset link.");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <Zap className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Reset password</h1>
            <p className="text-sm text-zinc-500">We&apos;ll email you a reset link</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p> : null}
          {message ? <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{message}</p> : null}
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-400 hover:to-amber-300 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/auth/signin" className="text-amber-400 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
