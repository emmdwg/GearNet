import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radii } from "../../lib/theme";

type Props = {
  userId: string;
  username?: string;
  initialFollowing: boolean;
  size?: "sm" | "md";
  onSignInRequired?: () => void;
  onChange?: (following: boolean) => void;
};

export function FollowButton({
  userId,
  username,
  initialFollowing,
  size = "md",
  onSignInRequired,
  onChange,
}: Props) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [userId, initialFollowing]);

  if (user && user.id === userId) return null;

  async function toggle() {
    if (!user) {
      onSignInRequired?.();
      return;
    }
    setLoading(true);
    const next = !following;
    setFollowing(next);
    onChange?.(next);
    try {
      const result = await api.toggleFollow(userId);
      setFollowing(result.isFollowing);
      onChange?.(result.isFollowing);
    } catch {
      setFollowing(!next);
      onChange?.(!next);
    } finally {
      setLoading(false);
    }
  }

  const small = size === "sm";

  return (
    <Pressable
      onPress={toggle}
      disabled={loading}
      style={[
        styles.base,
        small && styles.small,
        following ? styles.followingBtn : styles.followBtn,
        loading && { opacity: 0.6 },
      ]}
    >
      <Text style={[small ? styles.smallText : styles.text, following ? styles.followingText : styles.followText]}>
        {following ? "Following" : "Follow"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  small: { paddingVertical: 6, paddingHorizontal: 12 },
  followBtn: { backgroundColor: colors.accent },
  followingBtn: { borderWidth: 1, borderColor: colors.borderLight, backgroundColor: "transparent" },
  text: { fontSize: 14, fontWeight: "600" },
  smallText: { fontSize: 12, fontWeight: "600" },
  followText: { color: colors.accentText },
  followingText: { color: colors.textMuted },
});
