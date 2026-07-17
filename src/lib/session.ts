import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AppSessionUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  image: string;
  location?: string;
};

export type AppSession = {
  user: AppSessionUser;
};

async function profileFromAuthUser(authUserId: string): Promise<AppSession | null> {
  const profile = await prisma.user.findUnique({ where: { id: authUserId } });
  if (!profile) return null;

  return {
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.displayName,
      username: profile.username,
      image:
        profile.avatar ??
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
      location: profile.location ?? "",
    },
  };
}

export async function getSessionFromBearer(token: string): Promise<AppSession | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createSupabaseClient(url, anonKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return profileFromAuthUser(user.id);
}

export async function getSession(): Promise<AppSession | null> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return getSessionFromBearer(authHeader.slice(7));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return profileFromAuthUser(user.id);
}
