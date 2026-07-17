import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { feedThumbnail } from "../../lib/post-media";
import { colors, radii, spacing } from "../../lib/theme";
import type { Post } from "../../lib/types";

type Props = {
  onOpen?: (postId: string) => void;
};

export function BuildOfWeekStrip({ onOpen }: Props) {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    api
      .getBuildOfWeek()
      .then((data) => setPost(data.post ?? null))
      .catch(() => setPost(null));
  }, []);

  if (!post?.user) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={16} color="#fbbf24" />
        <Text style={styles.title}>Build of the Week</Text>
      </View>
      <Pressable style={styles.card} onPress={() => onOpen?.(post.id)}>
        <Image source={{ uri: feedThumbnail(post) }} style={styles.image} />
        <View style={styles.meta}>
          <Text style={styles.featured}>Featured build</Text>
          <Text style={styles.user} numberOfLines={1}>
            @{post.user.username}
          </Text>
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption || "Tap to view"}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md, gap: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontWeight: "600", color: colors.text },
  card: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    backgroundColor: colors.cardMuted,
  },
  image: { width: 96, height: 96, backgroundColor: colors.border },
  meta: { flex: 1, justifyContent: "center", gap: 2, padding: 12 },
  featured: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#fbbf24",
  },
  user: { fontSize: 14, fontWeight: "600", color: colors.text },
  caption: { fontSize: 12, color: colors.textDim, lineHeight: 16 },
});
