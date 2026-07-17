import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CreatePostForm, CreatePitUpdateForm } from "../components/forms/CreateForms";
import { PushPromptBanner } from "../components/ui/PushPromptBanner";
import { OnboardingBanner } from "../components/onboarding/OnboardingBanner";
import { ScenePicker } from "../components/onboarding/ScenePicker";
import { PitUpdateStrip } from "../components/feed/PitUpdateStrip";
import { BuildOfWeekStrip } from "../components/feed/BuildOfWeekStrip";
import { BuildStyleGrid } from "../components/feed/BuildStyleGrid";
import { PostCard } from "../components/feed/PostCard";
import { SuggestedBuilders } from "../components/social/SuggestedBuilders";
import { AuthPrompt } from "../components/ui/AuthPrompt";
import { ErrorState } from "../components/ui/ErrorState";
import { ExploreBrandBar } from "../components/ui/ExploreBrandBar";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../lib/auth";
import { useChromeScrollHandler } from "../lib/scroll-chrome";
import { useUnread } from "../lib/useUnread";
import { api, API_URL } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { PitUpdate, Post } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function ExploreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading: authLoading } = useAuth();
  const unread = useUnread();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pitUpdates, setPitUpdates] = useState<PitUpdate[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"foryou" | "following" | "nearyou">("foryou");
  const [nearYouPosts, setNearYouPosts] = useState<Post[]>([]);
  const [nearYouError, setNearYouError] = useState("");
  const [nearYouLoading, setNearYouLoading] = useState(false);
  const [nearYouRadius, setNearYouRadius] = useState(50);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [mutedAuthorIds, setMutedAuthorIds] = useState<Set<string>>(() => new Set());
  const [postOpen, setPostOpen] = useState(false);
  const [pitOpen, setPitOpen] = useState(false);
  const [activeScene, setActiveScene] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      let coords: { lat: number; lng: number } | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        }
      } catch {
        /* location optional for ranking */
      }

      const [postsResult, pitResult] = await Promise.allSettled([
        api.getPosts("all", coords),
        api.getPitUpdates(),
      ]);
      const postsData = postsResult.status === "fulfilled" ? postsResult.value : [];
      const pitData = pitResult.status === "fulfilled" ? pitResult.value : [];

      if (postsResult.status === "rejected" && pitResult.status === "rejected") {
        setError(`Could not reach GearNet API at ${API_URL}. Run npm run dev:all on your PC and use the same Wi‑Fi.`);
        return;
      }

      setPosts(postsData);
      setPitUpdates(pitData);

      const [followRes, bookmarkRes, likedRes] = await Promise.allSettled([
        api.getFollowing(user.username),
        api.getBookmarks(),
        api.getLikedPostIds(),
      ]);
      if (followRes.status === "fulfilled") {
        setFollowingIds(new Set(followRes.value.users.map((u) => u.id)));
      }
      if (bookmarkRes.status === "fulfilled") {
        setBookmarkedIds(new Set(bookmarkRes.value.postIds));
      }
      if (likedRes.status === "fulfilled") {
        setLikedIds(new Set(likedRes.value.postIds));
      }
    } catch {
      setError(`Could not reach GearNet API at ${API_URL}. Run npm run dev:all on your PC and use the same Wi‑Fi.`);
    }
  }, [user]);

  const loadNearYou = useCallback(
    async (radius = nearYouRadius) => {
      setNearYouLoading(true);
      setNearYouError("");
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setNearYouError("Enable location to see posts near you");
          setNearYouPosts([]);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const data = await api.getDiscoverNearYou(loc.coords.latitude, loc.coords.longitude, radius);
        setNearYouPosts(data);
      } catch {
        setNearYouError("Could not load nearby posts");
        setNearYouPosts([]);
      } finally {
        setNearYouLoading(false);
      }
    },
    [nearYouRadius],
  );

  useEffect(() => {
    if (!user) return;
    api
      .getSettings()
      .then((data) => {
        if (data.settings.nearYouRadius) setNearYouRadius(data.settings.nearYouRadius);
      })
      .catch(() => null);
  }, [user]);

  useEffect(() => {
    if (tab === "nearyou" && user) loadNearYou();
  }, [tab, loadNearYou, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
  }, [user, authLoading, load]);

  const onScroll = useChromeScrollHandler();
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredPosts = useMemo(() => {
    if (tab === "nearyou") return nearYouPosts;
    let result = posts.filter(
      (p) => p.status !== "draft" && !hiddenIds.has(p.id) && !mutedAuthorIds.has(p.userId),
    );
    if (tab === "following") {
      result = result.filter((post) => followingIds.has(post.userId));
    }
    if (activeScene) {
      result = result.filter(
        (p) =>
          p.user?.sceneTags?.includes(activeScene) ||
          (p.tags ?? []).some((t) => t.toLowerCase() === activeScene),
      );
    }
    return result;
  }, [posts, tab, followingIds, nearYouPosts, hiddenIds, mutedAuthorIds, activeScene]);

  if (authLoading || (user && loading)) return <LoadingState />;

  if (!user) {
    return (
      <View style={styles.screen}>
        <ExploreBrandBar
          onProfilePress={() => navigation.navigate("SignIn")}
          onSearchPress={() => navigation.navigate("Search")}
          onActivityPress={() => navigation.navigate("SignIn")}
          rightAction={
            <Pressable
              onPress={() => navigation.navigate("SignIn")}
              style={styles.addBtn}
              accessibilityLabel="Create post"
            >
              <Ionicons name="add" size={22} color={colors.accentText} />
            </Pressable>
          }
        />
        <AuthPrompt
          title="Sign in to Explore"
          description="Follow builders, see pits near you, and share your own builds with the scene."
          onSignIn={() => navigation.navigate("SignIn")}
          onSignUp={() => navigation.navigate("SignUp")}
        />
      </View>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          load().finally(() => setLoading(false));
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ExploreBrandBar
        unreadCount={unread}
        onProfilePress={() => navigation.navigate("Profile", { username: user.username })}
        onSearchPress={() => navigation.navigate("Search")}
        onActivityPress={() => navigation.navigate("Activity")}
        rightAction={
          <Pressable
            onPress={() => setPostOpen(true)}
            style={styles.addBtn}
            accessibilityLabel="Create post"
          >
            <Ionicons name="add" size={22} color={colors.accentText} />
          </Pressable>
        }
      />
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.headerPad}>
            <View style={styles.tabs}>
              <Pressable
                onPress={() => setTab("foryou")}
                style={[styles.tab, tab === "foryou" && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === "foryou" && styles.tabTextActive]}>For You</Text>
              </Pressable>
              <Pressable
                onPress={() => setTab("following")}
                style={[styles.tab, tab === "following" && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === "following" && styles.tabTextActive]}>Following</Text>
              </Pressable>
              <Pressable
                onPress={() => setTab("nearyou")}
                style={[styles.tab, tab === "nearyou" && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === "nearyou" && styles.tabTextActive]}>Near You</Text>
              </Pressable>
            </View>

            <PushPromptBanner />
            <OnboardingBanner />
            <ScenePicker />

            {tab === "foryou" ? (
              <>
                <PitUpdateStrip
                  updates={pitUpdates}
                  onAdd={() => setPitOpen(true)}
                  onProfilePress={(username) => navigation.navigate("Profile", { username })}
                  onUpdatePress={(updateId) => navigation.navigate("PitUpdateViewer", { updateId })}
                />
                <BuildStyleGrid posts={posts} activeScene={activeScene} onSceneSelect={setActiveScene} />
                <Pressable style={styles.reelsBtn} onPress={() => navigation.navigate("BuildReels")}>
                  <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.reelsBtnText}>Watch Build Reels</Text>
                </Pressable>
                <BuildOfWeekStrip
                  onOpen={(postId) => {
                    const post = posts.find((p) => p.id === postId);
                    navigation.navigate("PostViewer", { postId, post });
                  }}
                />
              </>
            ) : null}

            {activeScene ? (
              <Pressable onPress={() => setActiveScene(null)} style={styles.sceneChip}>
                <Text style={styles.sceneChipText}>{activeScene} ×</Text>
              </Pressable>
            ) : null}

            <View style={styles.feedHeading}>
              <Text style={styles.feedTitle}>
                {tab === "nearyou" ? "Near you" : tab === "following" ? "Following" : "Feed"}
              </Text>
              <Text style={styles.feedSubtitle}>
                {tab === "nearyou"
                  ? "Geo-tagged builds around you"
                  : tab === "following"
                    ? "From builders you follow"
                    : "Fresh posts from the community"}
              </Text>
            </View>

            {tab === "nearyou" && !nearYouLoading && !nearYouError ? (
              <View style={styles.radiusRow}>
                <Text style={styles.radiusLabel}>Radius: {nearYouRadius} mi</Text>
                <Pressable
                  onPress={() => {
                    const next = nearYouRadius >= 200 ? 25 : nearYouRadius + 25;
                    setNearYouRadius(next);
                    api.updateSettings({ settings: { nearYouRadius: next } }).catch(() => null);
                    loadNearYou(next);
                  }}
                >
                  <Text style={styles.radiusBtn}>Adjust</Text>
                </Pressable>
              </View>
            ) : null}
            {tab === "nearyou" && nearYouLoading ? (
              <Text style={styles.empty}>Finding posts near you...</Text>
            ) : null}
            {tab === "nearyou" && nearYouError ? (
              <Text style={styles.empty}>{nearYouError}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            initialBookmarked={bookmarkedIds.has(item.id)}
            initialLiked={likedIds.has(item.id)}
            onProfilePress={(username) => navigation.navigate("Profile", { username })}
            onSignInRequired={() => navigation.navigate("SignIn")}
            onOpen={(postId) => {
              const post = filteredPosts.find((p) => p.id === postId);
              navigation.navigate("PostViewer", { postId, post });
            }}
            onChanged={load}
            onHidden={() => setHiddenIds((prev) => new Set(prev).add(item.id))}
            onMuted={() => setMutedAuthorIds((prev) => new Set(prev).add(item.userId))}
          />
        )}
        ListEmptyComponent={
          tab === "following" ? (
            <View style={styles.followingEmpty}>
              <Text style={styles.empty}>Nothing here yet. Follow a few builders to fill this feed.</Text>
              <SuggestedBuilders
                onProfilePress={(username) => navigation.navigate("Profile", { username })}
                onSignInRequired={() => navigation.navigate("SignIn")}
              />
            </View>
          ) : tab === "nearyou" ? (
            <View style={styles.emptyBox}>
              <Text style={styles.empty}>
                {nearYouError || "No geo-tagged posts nearby yet. Tag location when you post from a meet."}
              </Text>
              {!nearYouError ? (
                <View style={styles.emptyCtaRow}>
                  <Pressable
                    style={styles.emptyCta}
                    onPress={() => navigation.navigate("MainTabs", { screen: "Meets" })}
                  >
                    <Text style={styles.emptyCtaText}>Find a meet</Text>
                  </Pressable>
                  <Pressable style={styles.emptyCtaSecondary} onPress={() => setPostOpen(true)}>
                    <Text style={styles.emptyCtaSecondaryText}>Share a build</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.empty}>No posts yet. Be the first to share a build.</Text>
              <View style={styles.emptyCtaRow}>
                <Pressable style={styles.emptyCta} onPress={() => setPostOpen(true)}>
                  <Text style={styles.emptyCtaText}>Share a post</Text>
                </Pressable>
              </View>
            </View>
          )
        }
      />
      {postOpen ? (
        <CreatePostForm visible onClose={() => setPostOpen(false)} onSuccess={load} />
      ) : null}
      {pitOpen ? (
        <CreatePitUpdateForm visible onClose={() => setPitOpen(false)} onSuccess={load} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: spacing.xl + spacing.lg,
  },
  headerPad: {
    paddingHorizontal: spacing.lg,
  },
  empty: {
    textAlign: "center",
    color: colors.textDim,
    fontSize: 14,
    marginTop: 24,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  emptyBox: { alignItems: "center", paddingBottom: spacing.lg },
  emptyCtaRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  emptyCta: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyCtaText: { color: colors.accentText, fontWeight: "700", fontSize: 14 },
  emptyCtaSecondary: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(39,39,42,0.8)",
  },
  emptyCtaSecondaryText: { color: colors.textDim, fontWeight: "600", fontSize: 14 },
  followingEmpty: { marginTop: 8 },
  sceneChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: spacing.sm,
  },
  sceneChipText: { fontSize: 12, color: colors.accent, fontWeight: "500" },
  tabs: {
    flexDirection: "row",
    gap: 4,
    marginBottom: spacing.md,
    padding: 4,
    borderRadius: 999,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textDim },
  tabTextActive: { color: colors.accentText },
  feedHeading: { marginBottom: spacing.md, marginTop: spacing.xs },
  feedTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  feedSubtitle: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
  radiusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  radiusLabel: { color: colors.textDim, fontSize: 12 },
  radiusBtn: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  reelsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    backgroundColor: "rgba(245,158,11,0.08)",
  },
  reelsBtnText: { fontSize: 13, fontWeight: "600", color: colors.accent },
});
