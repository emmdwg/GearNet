import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "../components/feed/PostCard";
import { ListingCard } from "../components/marketplace/ListingCard";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { MarketplaceListing, Post } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function SavedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getBookmarks();
      setPosts(data.posts);
      setListings(data.listings);
      setError("");
    } catch {
      setError("Could not load saved items");
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;

  const isEmpty = posts.length === 0 && listings.length === 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Ionicons name="bookmark" size={18} color={colors.accent} />
          <Text style={styles.title}>Saved</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {isEmpty ? (
          <Text style={styles.empty}>
            Nothing saved yet. Tap the bookmark icon on a post or listing to keep it here.
          </Text>
        ) : (
          <>
            {posts.length > 0 ? (
              <>
                <Text style={styles.section}>Saved Posts</Text>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    initialBookmarked
                    onProfilePress={(username) => navigation.navigate("Profile", { username })}
                    onSignInRequired={() => navigation.navigate("SignIn")}
                    onOpen={(postId) => navigation.navigate("PostViewer", { postId, post })}
                    onChanged={load}
                  />
                ))}
              </>
            ) : null}

            {listings.length > 0 ? (
              <>
                <Text style={styles.section}>Saved Listings</Text>
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    initialBookmarked
                    onChanged={load}
                    onSignInRequired={() => navigation.navigate("SignIn")}
                  />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  section: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 12, marginTop: 4 },
  empty: {
    textAlign: "center",
    color: colors.textDim,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
});
