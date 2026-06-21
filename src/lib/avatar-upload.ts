import { uploadImage } from "@/lib/storage";

export async function resolveAvatarForUser(userId: string, avatar?: string | null): Promise<string | null> {
  if (!avatar || typeof avatar !== "string") return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  try {
    const result = await uploadImage(userId, avatar, "avatars");
    return result.url;
  } catch {
    return null;
  }
}
