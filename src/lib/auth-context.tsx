"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppSessionUser } from "@/lib/session";

type AuthContextValue = {
  user: AppSessionUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(authUserId: string, email: string): Promise<AppSessionUser | null> {
  const res = await fetch("/api/me");
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.authenticated || !data.user) return null;

  return {
    id: data.user.id ?? authUserId,
    email: data.user.email ?? email,
    name: data.user.name ?? "",
    username: data.user.username ?? "",
    image: data.user.image ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUser(null);
      return;
    }

    const profile = await fetchProfile(session.user.id, session.user.email ?? "");
    setUser(profile);
  }, [supabase]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => subscription.unsubscribe();
  }, [supabase, refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo(
    () => ({ user, loading, signOut, refresh }),
    [user, loading, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
