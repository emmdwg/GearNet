import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { SCENE_TAGS } from "../../lib/scene-tags";
import { colors, radii, spacing } from "../../lib/theme";
import type { Post } from "../../lib/types";
import type { RootStackParamList } from "../../navigation/types";

type Props = {
  posts: Post[];
  activeScene?: string | null;
  onSceneSelect: (sceneId: string | null) => void;
};

export function BuildStyleGrid({ posts, activeScene, onSceneSelect }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [followedScenes, setFollowedScenes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    api
      .getTagFollows()
      .then((data) => {
        const scenes = new Set(data.filter((f) => f.tagType === "scene").map((f) => f.tag));
        setFollowedScenes(scenes);
      })
      .catch(() => null);
  }, [user]);

  const sceneCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      const authorScenes = post.user?.sceneTags ?? [];
      const postTags = post.tags ?? [];
      for (const scene of SCENE_TAGS) {
        if (authorScenes.includes(scene.id) || postTags.some((t) => t.toLowerCase() === scene.id)) {
          counts.set(scene.id, (counts.get(scene.id) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [posts]);

  const previewFor = (sceneId: string) =>
    posts.find(
      (p) =>
        p.user?.sceneTags?.includes(sceneId) || (p.tags ?? []).some((t) => t.toLowerCase() === sceneId),
    )?.image;

  async function toggleFollow(sceneId: string) {
    if (!user) {
      navigation.navigate("SignIn");
      return;
    }
    const res = await api.toggleTagFollow(sceneId, "scene");
    setFollowedScenes((prev) => {
      const next = new Set(prev);
      if (res.following) next.add(sceneId);
      else next.delete(sceneId);
      return next;
    });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Explore by build style</Text>
        {activeScene ? (
          <Pressable onPress={() => onSceneSelect(null)} hitSlop={8}>
            <Text style={styles.clear}>Clear filter</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.grid}>
        {SCENE_TAGS.map((scene) => {
          const count = sceneCounts.get(scene.id) ?? 0;
          const preview = previewFor(scene.id);
          const active = activeScene === scene.id;
          const following = followedScenes.has(scene.id);
          return (
            <View key={scene.id} style={[styles.card, active && styles.cardActive]}>
              <Pressable onPress={() => onSceneSelect(active ? null : scene.id)}>
                <View style={styles.preview}>
                  {preview ? (
                    <Image source={{ uri: preview }} style={styles.previewImg} />
                  ) : (
                    <View style={styles.previewEmpty}>
                      <Text style={styles.previewEmptyText}>No posts yet</Text>
                    </View>
                  )}
                  <View style={styles.previewOverlay} />
                  <View style={styles.previewMeta}>
                    <Text style={styles.sceneLabel}>{scene.label}</Text>
                    <Text style={styles.sceneCount}>{count} posts</Text>
                  </View>
                </View>
              </Pressable>
              {user ? (
                <Pressable
                  onPress={() => void toggleFollow(scene.id)}
                  style={[styles.followBtn, following && styles.followBtnActive]}
                >
                  <Text style={[styles.followText, following && styles.followTextActive]}>
                    {following ? "Following scene" : "Follow scene"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
      {activeScene ? (
        <Text style={styles.filterHint}>
          Showing {SCENE_TAGS.find((s) => s.id === activeScene)?.label} builds.{" "}
          <Text style={styles.filterLink} onPress={() => navigation.navigate("Tag", { tag: activeScene })}>
            View tag page →
          </Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "600", color: colors.text },
  clear: { fontSize: 12, color: colors.accent, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: {
    width: "48%",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  cardActive: { borderColor: colors.accent, borderWidth: 2 },
  preview: { aspectRatio: 4 / 3, backgroundColor: colors.border },
  previewImg: { width: "100%", height: "100%" },
  previewEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  previewEmptyText: { fontSize: 11, color: colors.textFaint },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  previewMeta: { position: "absolute", left: 8, right: 8, bottom: 8 },
  sceneLabel: { fontSize: 13, fontWeight: "600", color: colors.text },
  sceneCount: { fontSize: 10, color: colors.textDim, marginTop: 2 },
  followBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.cardMuted,
  },
  followBtnActive: { backgroundColor: "rgba(245,158,11,0.12)" },
  followText: { fontSize: 10, fontWeight: "600", color: colors.textDim },
  followTextActive: { color: colors.accent },
  filterHint: { fontSize: 12, color: colors.textDim, marginTop: 4 },
  filterLink: { color: colors.accent, fontWeight: "600" },
});
