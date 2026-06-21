import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FollowButton } from "../components/social/FollowButton";
import { Avatar } from "../components/ui/Avatar";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, spacing } from "../lib/theme";
import type { User } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function FollowListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "FollowList">>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { username, mode } = route.params;

  const [users, setUsers] = useState<User[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = mode === "followers" ? await api.getFollowers(username) : await api.getFollowing(username);
      setUsers(res.users);

      if (user) {
        try {
          const mine = await api.getFollowing(user.username);
          setFollowingSet(new Set(mine.users.map((u) => u.id)));
        } catch {
          // non-fatal
        }
      }
      setError("");
    } catch {
      setError("Could not load list");
    }
  }, [mode, username, user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{mode === "followers" ? "Followers" : "Following"}</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable style={styles.user} onPress={() => navigation.push("Profile", { username: item.username })}>
              <Avatar src={item.avatar} alt={item.displayName} size="md" />
              <View style={styles.userText}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <Text style={styles.handle} numberOfLines={1}>
                  @{item.username}
                </Text>
                {item.bio ? (
                  <Text style={styles.bio} numberOfLines={2}>
                    {item.bio}
                  </Text>
                ) : null}
              </View>
            </Pressable>
            <FollowButton
              userId={item.id}
              username={item.username}
              initialFollowing={followingSet.has(item.id)}
              size="sm"
              onSignInRequired={() => navigation.navigate("SignIn")}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
          </Text>
        }
      />
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
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  list: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  user: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  userText: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  handle: { fontSize: 13, color: colors.textDim },
  bio: { fontSize: 12, color: colors.textFaint, marginTop: 4, lineHeight: 16 },
  empty: { textAlign: "center", color: colors.textDim, fontSize: 14, marginTop: 40 },
});
