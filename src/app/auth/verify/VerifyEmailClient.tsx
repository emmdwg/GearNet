"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) {
      setError("Missing email address.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${appUrl}/auth/callback` },
    });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage("Verification email sent. Check your inbox and spam folder.");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
          <Mail className="h-6 w-6 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Verify your email</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We sent a confirmation link to{" "}
          <span className="font-medium text-zinc-200">{email || "your email"}</span>. Open it to activate your account,
          then sign in.
        </p>
        {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          onClick={resend}
          disabled={loading || !email}
          className="mt-6 w-full rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Resend verification email"}
        </button>
        <p className="mt-6 text-sm text-zinc-500">
          Already verified?{" "}
          <Link href="/auth/signin" className="text-amber-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
