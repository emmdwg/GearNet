"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Zap } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", username: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (signInError) {
      setError("Account created but sign-in failed. Try signing in.");
      return;
    }

    router.push("/explore");
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500">
            <Zap className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Join GearNet</h1>
            <p className="text-sm text-zinc-500">Create your Digital Garage</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <p className="text-center text-xs text-zinc-500">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-amber-400 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-amber-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>

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
