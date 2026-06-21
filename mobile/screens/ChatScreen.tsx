import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { NewChatModal } from "../components/chat/NewChatModal";
import { AuthPrompt } from "../components/ui/AuthPrompt";
import { Avatar } from "../components/ui/Avatar";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { SearchInput } from "../components/ui/SearchInput";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { colors, spacing } from "../lib/theme";
import { formatRelativeDate } from "../lib/utils";
import type { Conversation } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function ChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setConversations(await api.getConversations());
      setError("");
    } catch {
      setError("Could not load conversations");
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
  }, [user, authLoading, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const other = conv.otherUser;
      if (!other) return false;
      return (
        other.displayName.toLowerCase().includes(q) ||
        other.username.toLowerCase().includes(q) ||
        conv.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [conversations, search]);

  if (authLoading || (user && loading)) return <LoadingState />;

  if (!user) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          title="Cruise Chat"
          subtitle="Connect with enthusiasts, coordinate cruises, and talk tech"
          onProfilePress={() => navigation.navigate("SignIn")}
        />
        <AuthPrompt
          title="Sign in to chat"
          description="Message other enthusiasts, coordinate cruises, and talk builds in real time."
          onSignIn={() => navigation.navigate("SignIn")}
          onSignUp={() => navigation.navigate("SignUp")}
        />
      </View>
    );
  }

  if (error) return <ErrorState message={error} />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Cruise Chat"
        subtitle="Connect with enthusiasts, coordinate cruises, and talk tech"
        onProfilePress={() => navigation.navigate("Profile", { username: user.username })}
        rightAction={
          <Pressable onPress={() => setNewChatOpen(true)} style={styles.newChatBtn} accessibilityLabel="New chat">
            <Ionicons name="add" size={22} color={colors.accentText} />
          </Pressable>
        }
      />
      <View style={styles.searchWrap}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search chats..." />
      </View>
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        renderItem={({ item }) => {
          const other = item.otherUser;
          if (!other) return null;
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() =>
                navigation.navigate("ChatThread", {
                  conversationId: item.id,
                  otherUser: other,
                })
              }
            >
              <Avatar src={other.avatar} alt={other.displayName} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName}>{other.displayName}</Text>
                  <Text style={styles.rowTime}>{formatRelativeDate(item.lastMessageAt)}</Text>
                </View>
                <Text style={styles.rowPreview} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              {item.unread > 0 ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search.trim() ? "No chats match your search." : "No conversations yet. Start a new chat."}
          </Text>
        }
      />
      <NewChatModal
        visible={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onStarted={(conversationId, otherUser) => {
          navigation.navigate("ChatThread", { conversationId, otherUser });
          load();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(39,39,42,0.5)",
  },
  rowPressed: { backgroundColor: "rgba(39,39,42,0.5)" },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  rowName: { fontWeight: "500", color: colors.text, fontSize: 15 },
  rowTime: { fontSize: 10, color: colors.textFaint },
  rowPreview: { fontSize: 12, color: colors.textDim, marginTop: 2 },
  unread: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { fontSize: 10, fontWeight: "700", color: colors.accentText },
  empty: { textAlign: "center", color: colors.textDim, marginTop: 32, fontSize: 14, paddingHorizontal: spacing.lg },
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
