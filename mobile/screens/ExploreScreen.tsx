import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CreatePostForm, CreatePitUpdateForm } from "../components/forms/CreateForms";
import { OnboardingBanner } from "../components/onboarding/OnboardingBanner";
import { PitUpdateStrip } from "../components/feed/PitUpdateStrip";
import { PostCard } from "../components/feed/PostCard";
import { SuggestedBuilders } from "../components/social/SuggestedBuilders";
import { TrendingTags } from "../components/tags/TrendingTags";
import { ErrorState } from "../components/ui/ErrorState";
import { ExploreBrandBar } from "../components/ui/ExploreBrandBar";
import { LoadingState } from "../components/ui/LoadingState";
import { SearchInput } from "../components/ui/SearchInput";
import { useAuth } from "../lib/auth";
import { useUnread } from "../lib/useUnread";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { PitUpdate, Post } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

const COLLAPSE_THRESHOLD = 48;

export function ExploreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const unread = useUnread();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pitUpdates, setPitUpdates] = useState<PitUpdate[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const [postOpen, setPostOpen] = useState(false);
  const [pitOpen, setPitOpen] = useState(false);

  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleHeight = useRef(new Animated.Value(1)).current;

  function requireAuth(action: () => void) {
    if (!user) {
      navigation.navigate("SignIn");
      return;
    }
    action();
  }

  const load = useCallback(async () => {
    setError("");
    try {
      const [postsResult, pitResult] = await Promise.allSettled([api.getPosts(), api.getPitUpdates()]);
      const postsData = postsResult.status === "fulfilled" ? postsResult.value : [];
      const pitData = pitResult.status === "fulfilled" ? pitResult.value : [];

      if (postsResult.status === "rejected" && pitResult.status === "rejected") {
        setError("Could not reach GearNet API. Is npm run dev running?");
        return;
      }

      setPosts(postsData);
      setPitUpdates(pitData);

      if (user) {
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
      } else {
        setFollowingIds(new Set());
        setBookmarkedIds(new Set());
        setLikedIds(new Set());
      }
    } catch {
      setError("Could not reach GearNet API. Is npm run dev running?");
    }
  }, [user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: collapsed ? 0 : 1,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(titleHeight, {
        toValue: collapsed ? 0 : 1,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [collapsed, titleOpacity, titleHeight]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setCollapsed((prev) => {
      if (!prev && y > COLLAPSE_THRESHOLD) return true;
      if (prev && y <= COLLAPSE_THRESHOLD) return false;
      return prev;
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (tab === "following") {
      result = result.filter((post) => followingIds.has(post.userId));
    }
    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
      (post) =>
        post.caption.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        post.user?.username.toLowerCase().includes(q) ||
        post.user?.displayName.toLowerCase().includes(q)
    );
  }, [posts, search, tab, followingIds]);

  const animatedTitleStyle = {
    opacity: titleOpacity,
    maxHeight: titleHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 96] }),
    overflow: "hidden" as const,
  };

  if (loading) return <LoadingState />;
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
        onProfilePress={() =>
          user ? navigation.navigate("Profile", { username: user.username }) : navigation.navigate("SignIn")
        }
        onSearchPress={() => navigation.navigate("Search")}
        onSavedPress={() => requireAuth(() => navigation.navigate("Saved"))}
        onActivityPress={() => requireAuth(() => navigation.navigate("Activity"))}
        onSettingsPress={() => requireAuth(() => navigation.navigate("Settings"))}
        rightAction={
          <Pressable
            onPress={() => requireAuth(() => setPostOpen(true))}
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
          <>
            <Animated.View style={animatedTitleStyle}>
              <Text style={styles.title}>Explore Feed</Text>
              <Text style={styles.subtitle}>Community builds, tech updates & car photography</Text>
            </Animated.View>
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search builds, tags, users..."
            />
            {user ? <OnboardingBanner /> : null}
            <TrendingTags compact />
            <View style={styles.tabs}>
              <Pressable
                onPress={() => setTab("foryou")}
                style={[styles.tab, tab === "foryou" && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === "foryou" && styles.tabTextActive]}>For You</Text>
              </Pressable>
              <Pressable
                onPress={() => requireAuth(() => setTab("following"))}
                style={[styles.tab, tab === "following" && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === "following" && styles.tabTextActive]}>Following</Text>
              </Pressable>
            </View>
            <PitUpdateStrip
              updates={pitUpdates}
              onAdd={() => requireAuth(() => setPitOpen(true))}
              onProfilePress={(username) => navigation.navigate("Profile", { username })}
              onUpdatePress={(updateId) => navigation.navigate("PitUpdateViewer", { updateId })}
            />
          </>
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
          />
        )}
        ListEmptyComponent={
          tab === "following" ? (
            <View style={styles.followingEmpty}>
              <Text style={styles.empty}>
                {search ? "No posts match your search." : "Follow builders to see their posts here."}
              </Text>
              <SuggestedBuilders
                onProfilePress={(username) => navigation.navigate("Profile", { username })}
                onSignInRequired={() => navigation.navigate("SignIn")}
              />
            </View>
          ) : (
            <Text style={styles.empty}>No posts match your search.</Text>
          )
        }
      />
      <CreatePostForm visible={postOpen} onClose={() => setPostOpen(false)} onSuccess={load} />
      <CreatePitUpdateForm visible={pitOpen} onClose={() => setPitOpen(false)} onSuccess={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textDim,
    marginBottom: spacing.md,
  },
  empty: {
    textAlign: "center",
    color: colors.textDim,
    fontSize: 14,
    marginTop: 24,
  },
  followingEmpty: { marginTop: 8 },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: colors.accent,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textDim },
  tabTextActive: { color: colors.accent },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
