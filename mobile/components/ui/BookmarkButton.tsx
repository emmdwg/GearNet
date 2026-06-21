import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { api, type BookmarkTargetType } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors } from "../../lib/theme";

type Props = {
  targetType: BookmarkTargetType;
  targetId: string;
  initialBookmarked?: boolean;
  showLabel?: boolean;
  onSignInRequired?: () => void;
  onChange?: (bookmarked: boolean) => void;
};

export function BookmarkButton({
  targetType,
  targetId,
  initialBookmarked = false,
  showLabel = false,
  onSignInRequired,
  onChange,
}: Props) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!user) {
      onSignInRequired?.();
      return;
    }
    setLoading(true);
    const next = !bookmarked;
    setBookmarked(next);
    onChange?.(next);
    try {
      const result = await api.toggleBookmark(targetType, targetId);
      setBookmarked(result.bookmarked);
      onChange?.(result.bookmarked);
    } catch {
      setBookmarked(!next);
      onChange?.(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable style={styles.action} onPress={toggle} disabled={loading} accessibilityLabel="Save">
      <Ionicons
        name={bookmarked ? "bookmark" : "bookmark-outline"}
        size={16}
        color={bookmarked ? colors.accent : colors.textDim}
      />
      {showLabel ? (
        <Text style={[styles.label, bookmarked && { color: colors.accent }]}>
          {bookmarked ? "Saved" : "Save"}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 13, color: colors.textDim },
});
