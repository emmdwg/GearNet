import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setAuthToken } from "./api";
import { formatAuthError, normalizePhone } from "./auth-errors";
import { supabase } from "./supabase";
import type { AuthUser } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; username: string; displayName: string; avatar?: string }) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneSignup: (data: {
    phone: string;
    otp: string;
    username: string;
    displayName: string;
    avatar?: string;
  }) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfile(me: {
  id: string;
  username?: string;
  name?: string;
  image?: string;
  email?: string;
}): AuthUser {
  return {
    id: me.id,
    username: me.username ?? "",
    displayName: me.name ?? "",
    avatar: me.image ?? "",
    email: me.email ?? "",
  };
}

const AUTH_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Auth request timed out")), ms);
    }),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncSession = useCallback(async (accessToken: string | null) => {
    setAuthToken(accessToken);
    if (!accessToken) {
      setUser(null);
      return;
    }

    try {
      const me = await withTimeout(api.getMe(), AUTH_TIMEOUT_MS);
      if (me.authenticated && me.user) {
        setUser(mapProfile(me.user));
        import("./push")
          .then(({ registerForPushNotifications }) => registerForPushNotifications())
          .catch(() => {});
      } else {
        setAuthToken(null);
        setUser(null);
      }
    } catch {
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
      await syncSession(session?.access_token ?? null);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [syncSession]);

  useEffect(() => {
    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session?.access_token ?? null).catch(() => {
        setAuthToken(null);
        setUser(null);
      });
    });

    return () => subscription.unsubscribe();
  }, [restoreSession, syncSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(formatAuthError(error.message));
      await syncSession(data.session?.access_token ?? null);
    },
    [syncSession]
  );

  const signUp = useCallback(async (data: { email: string; password: string; username: string; displayName: string; avatar?: string }) => {
    await api.register(data);
    const redirectTo = `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/auth/callback`;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: data.email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw new Error(error.message);
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    const redirectTo = `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/auth/callback`;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw new Error(error.message);
  }, []);

  const sendPhoneOtp = useCallback(async (phoneRaw: string) => {
    const phone = normalizePhone(phoneRaw);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw new Error(error.message);
  }, []);

  const verifyPhoneSignup = useCallback(
    async (data: { phone: string; otp: string; username: string; displayName: string; avatar?: string }) => {
      const phone = normalizePhone(data.phone);
      const { data: verified, error } = await supabase.auth.verifyOtp({
        phone,
        token: data.otp,
        type: "sms",
      });
      if (error || !verified.session) throw new Error(error?.message ?? "Invalid verification code");

      setAuthToken(verified.session.access_token);
      await api.completeProfile({
        username: data.username,
        displayName: data.displayName,
        phone,
        avatar: data.avatar,
      });
      await syncSession(verified.session.access_token);
    },
    [syncSession]
  );

  const refreshProfile = useCallback(async () => {
    try {
      const me = await api.getMe();
      if (me.authenticated && me.user) {
        setUser(mapProfile(me.user));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      sendPhoneOtp,
      verifyPhoneSignup,
      resendVerificationEmail,
      signOut,
      refreshProfile,
    }),
    [user, loading, signIn, signUp, sendPhoneOtp, verifyPhoneSignup, resendVerificationEmail, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
