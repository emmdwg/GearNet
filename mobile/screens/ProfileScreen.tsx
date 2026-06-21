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
import { VehicleCard } from "../components/garage/VehicleCard";
import { FollowButton } from "../components/social/FollowButton";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { FollowStats, Post, User, Vehicle } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Profile">>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { username } = route.params;
  const { user: currentUser, signOut } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followStats, setFollowStats] = useState<FollowStats>({ followers: 0, following: 0, isFollowing: false });
  const [tab, setTab] = useState<"posts" | "garage">("posts");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isOwnProfile = currentUser?.username === username;
  const gridSize = (width - spacing.lg * 2 - 4) / 3;

  const load = useCallback(async () => {
    try {
      const data = await api.getUser(username);
      setProfile(data.user);
      setVehicles(data.vehicles);
      setPosts(data.posts);
      setFollowStats(data.followStats ?? { followers: 0, following: 0, isFollowing: false });
      setError("");
    } catch {
      setError("Could not load profile");
    }
  }, [username]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleMessage() {
    if (!currentUser) {
      navigation.navigate("SignIn");
      return;
    }
    if (isOwnProfile) {
      navigation.navigate("MainTabs", { screen: "Chat" });
      return;
    }
    try {
      const conv = await api.createConversation(profile!.id);
      navigation.navigate("ChatThread", {
        conversationId: conv.id,
        otherUser: {
          id: profile!.id,
          username: profile!.username,
          displayName: profile!.displayName,
          avatar: profile!.avatar,
        },
      });
    } catch {
      navigation.navigate("MainTabs", { screen: "Chat" });
    }
  }

  if (loading) return <LoadingState />;
  if (error || !profile) return <ErrorState message={error || "Profile not found"} />;

  const cover = vehicles[0]?.image ?? posts[0]?.image ?? null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Cover */}
      <View style={styles.cover}>
        {cover ? <Image source={{ uri: cover }} style={styles.coverImg} blurRadius={2} /> : null}
        <View style={styles.coverOverlay} />
        <Pressable onPress={() => navigation.goBack()} style={[styles.back, { top: insets.top + 8 }]} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.bodyPad}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarRing}>
            <Avatar src={profile.avatar} alt={profile.displayName} size="lg" />
          </View>
          <View style={styles.topActions}>
            {isOwnProfile ? (
              <Pressable style={styles.pillBtn} onPress={() => navigation.navigate("Saved")}>
                <Ionicons name="bookmark-outline" size={15} color={colors.textMuted} />
                <Text style={styles.pillText}>Saved</Text>
              </Pressable>
            ) : (
              <FollowButton
                userId={profile.id}
                username={profile.username}
                initialFollowing={followStats.isFollowing}
                size="sm"
                onSignInRequired={() => navigation.navigate("SignIn")}
                onChange={(following) =>
                  setFollowStats((s) => ({
                    ...s,
                    isFollowing: following,
                    followers: Math.max(0, s.followers + (following ? 1 : -1)),
                  }))
                }
              />
            )}
            <Pressable style={styles.pillBtn} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={15} color={colors.textMuted} />
              <Text style={styles.pillText}>{isOwnProfile ? "Messages" : "Message"}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.handle}>@{profile.username}</Text>
        {profile.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textDim} />
            <Text style={styles.location}>{profile.location}</Text>
          </View>
        ) : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {profile.interests.length > 0 ? (
          <View style={styles.interests}>
            {profile.interests.map((interest) => (
              <Badge key={interest} variant="accent">
                {interest}
              </Badge>
            ))}
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <Pressable style={styles.stat} onPress={() => navigation.push("FollowList", { username, mode: "followers" })}>
            <Text style={styles.statNum}>{followStats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </Pressable>
          <Pressable style={styles.stat} onPress={() => navigation.push("FollowList", { username, mode: "following" })}>
            <Text style={styles.statNum}>{followStats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </Pressable>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
        </View>

        {isOwnProfile ? (
          <Pressable style={styles.signOut} onPress={() => signOut().then(() => navigation.navigate("MainTabs"))}>
            <Ionicons name="log-out-outline" size={14} color={colors.textDim} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "posts" && styles.tabActive]} onPress={() => setTab("posts")}>
          <Ionicons name="grid-outline" size={16} color={tab === "posts" ? colors.text : colors.textDim} />
          <Text style={[styles.tabText, tab === "posts" && styles.tabTextActive]}>Posts</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "garage" && styles.tabActive]} onPress={() => setTab("garage")}>
          <Ionicons name="car-outline" size={16} color={tab === "garage" ? colors.text : colors.textDim} />
          <Text style={[styles.tabText, tab === "garage" && styles.tabTextActive]}>Garage</Text>
        </Pressable>
      </View>

      {tab === "posts" ? (
        posts.length > 0 ? (
          <View style={styles.grid}>
            {posts.map((post) => (
              <Pressable
                key={post.id}
                style={{ width: gridSize, height: gridSize }}
                onPress={() => navigation.navigate("PostViewer", { postId: post.id, post })}
              >
                <Image source={{ uri: post.image }} style={styles.gridImg} />
                {post.images && post.images.length > 1 ? (
                  <View style={styles.gridBadge}>
                    <Ionicons name="copy-outline" size={13} color="#fff" />
                  </View>
                ) : null}
                <View style={styles.gridOverlay}>
                  <View style={styles.gridStat}>
                    <Ionicons name="heart" size={11} color="#fff" />
                    <Text style={styles.gridStatText}>{post.likes}</Text>
                  </View>
                  <View style={styles.gridStat}>
                    <Ionicons name="chatbubble" size={11} color="#fff" />
                    <Text style={styles.gridStatText}>{post.comments}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>No posts yet.</Text>
        )
      ) : vehicles.length > 0 ? (
        <View style={styles.bodyPad}>
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onChanged={load} />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No vehicles in the garage yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  cover: { height: 150, backgroundColor: colors.card, position: "relative" },
  coverImg: { ...StyleSheet.absoluteFillObject, opacity: 0.45 },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(9,9,11,0.35)" },
  back: {
    position: "absolute",
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(9,9,11,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  bodyPad: { paddingHorizontal: spacing.lg },
  avatarRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: -36 },
  avatarRing: {
    borderRadius: 999,
    borderWidth: 4,
    borderColor: colors.background,
  },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: { fontSize: 13, color: colors.textMuted },
  name: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 12 },
  handle: { fontSize: 14, color: colors.textDim, marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  location: { fontSize: 13, color: colors.textDim },
  bio: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 10 },
  interests: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  stats: {
    flexDirection: "row",
    marginTop: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  signOut: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, paddingVertical: 4 },
  signOutText: { fontSize: 12, color: colors.textDim },
  tabs: {
    flexDirection: "row",
    marginTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.textDim },
  tabTextActive: { color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2, paddingHorizontal: spacing.lg, paddingTop: 2 },
  gridImg: { width: "100%", height: "100%", borderRadius: 4, backgroundColor: colors.border },
  gridBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(9,9,11,0.6)",
    borderRadius: 6,
    padding: 3,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  gridStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  gridStatText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.textDim, fontSize: 14, paddingVertical: 40 },
});
