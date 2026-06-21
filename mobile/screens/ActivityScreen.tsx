import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../components/ui/Avatar";
import { LoadingState } from "../components/ui/LoadingState";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, radii, spacing } from "../lib/theme";
import type { Notification } from "../lib/types";
import { formatRelativeDate } from "../lib/utils";
import type { RootStackParamList } from "../navigation/types";

function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  if (type === "like") return "heart";
  if (type === "comment" || type === "reply") return "chatbubble";
  if (type === "rsvp") return "calendar";
  if (type === "post") return "camera";
  return "person-add";
}

export function ActivityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setItems(data.items);
      await api.markNotificationsRead();
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigation.replace("SignIn");
      return;
    }
    load().finally(() => setLoading(false));
  }, [user, navigation, load]);

  function handlePress(item: Notification) {
    if (item.targetType === "pit_update" && item.targetId) {
      navigation.navigate("PitUpdateViewer", { updateId: item.targetId });
      return;
    }
    if (item.targetType === "post" && item.targetId) {
      navigation.navigate("PostViewer", { postId: item.targetId });
      return;
    }
    if (item.type === "follow") {
      navigation.navigate("Profile", { username: item.actor.username });
      return;
    }
    navigation.navigate("Profile", { username: item.actor.username });
  }

  if (loading) return <LoadingState />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Likes, comments, meets & garage</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No activity yet. When someone interacts with your posts or pit updates, it shows up here.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.item, !item.read && styles.itemUnread]}
            onPress={() => handlePress(item)}
          >
            <Avatar src={item.actor.avatar} alt={item.actor.displayName} size="sm" />
            <View style={styles.itemBody}>
              <Text style={styles.itemText}>
                <Text style={styles.itemName}>{item.actor.displayName}</Text> {item.body}
              </Text>
              <Text style={styles.itemTime}>{formatRelativeDate(item.createdAt)}</Text>
            </View>
            <Ionicons name={iconFor(item.type)} size={16} color={colors.accent} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textDim, marginTop: 2 },
  list: { padding: spacing.lg, gap: spacing.sm },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
  },
  itemUnread: { backgroundColor: "rgba(245, 158, 11, 0.08)" },
  itemBody: { flex: 1 },
  itemText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  itemName: { fontWeight: "600", color: colors.text },
  itemTime: { fontSize: 11, color: colors.textFaint, marginTop: 4 },
  empty: {
    textAlign: "center",
    color: colors.textDim,
    fontSize: 14,
    padding: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
