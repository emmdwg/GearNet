import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrendingTags } from "../components/tags/TrendingTags";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { Post } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function TagScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Tag">>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { tag } = route.params;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const gridSize = (width - spacing.lg * 2 - 4) / 3;

  const load = useCallback(async () => {
    const data = await api.getPostsByTag(tag);
    setPosts(data.posts);
  }, [tag]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>HASHTAG</Text>
          <Text style={styles.title}>#{tag}</Text>
          <Text style={styles.sub}>{posts.length} posts</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <TrendingTags compact />
      </View>

      {posts.length === 0 ? (
        <Text style={styles.empty}>No posts with #{tag} yet.</Text>
      ) : (
        <View style={[styles.grid, { paddingHorizontal: spacing.lg }]}>
          {posts.map((post) => (
            <Pressable
              key={post.id}
              style={{ width: gridSize, height: gridSize }}
              onPress={() => navigation.navigate("PostViewer", { postId: post.id, post })}
            >
              <Image source={{ uri: post.image }} style={styles.gridImg} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, color: colors.accent },
  title: { fontSize: 28, fontWeight: "700", color: colors.text },
  sub: { fontSize: 13, color: colors.textDim, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2, paddingTop: 4 },
  gridImg: { width: "100%", height: "100%", borderRadius: 4, backgroundColor: colors.border },
  empty: { textAlign: "center", color: colors.textDim, fontSize: 14, paddingVertical: 40 },
});
