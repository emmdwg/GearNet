"use client";

import { createClient } from "@/lib/supabase/client";
import { formatAuthError, isEmailNotConfirmedError } from "@/lib/auth-errors";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Zap } from "lucide-react";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/explore";
  const verified = searchParams.get("verified") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      if (isEmailNotConfirmedError(signInError.message)) {
        setNeedsVerification(true);
      }
      setError(formatAuthError(signInError.message));
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <Zap className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to your garage</p>
          </div>
        </div>

        {verified ? (
          <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            Email verified. You can sign in now.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          {needsVerification ? (
            <p className="text-sm text-zinc-400">
              Need a new link?{" "}
              <Link href={`/auth/verify?email=${encodeURIComponent(email)}`} className="text-amber-400 hover:underline">
                Resend verification email
              </Link>
            </p>
          ) : null}
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
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-zinc-400">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-amber-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-400 hover:to-amber-300 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/auth/signup" className="text-amber-400 hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-zinc-600">Demo: mike@gearnet.app / password123</p>
      </div>
    </div>
  );
}
