import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { FormModal } from "../forms/FormModal";
import { Avatar } from "../ui/Avatar";
import { SearchInput } from "../ui/SearchInput";
import { api } from "../../lib/api";
import { colors, spacing } from "../../lib/theme";

type UserResult = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onStarted: (conversationId: string, otherUser: UserResult) => void;
};

export function NewChatModal({ visible, onClose, onStarted }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      return;
    }
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await api.searchUsers(query.trim()));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, visible]);

  async function startChat(user: UserResult) {
    setStarting(user.id);
    try {
      const { id } = await api.createConversation(user.id);
      onClose();
      onStarted(id, user);
    } catch {
      setStarting(null);
    }
  }

  return (
    <FormModal visible={visible} onClose={onClose} title="New Chat">
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or username..."
      />
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : null}
      {!loading && query.trim() && results.length === 0 ? (
        <Text style={styles.empty}>No users found</Text>
      ) : null}
      {results.map((user) => (
        <Pressable
          key={user.id}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => startChat(user)}
          disabled={starting === user.id}
        >
          <Avatar src={user.avatar} alt={user.displayName} size="sm" />
          <View style={styles.rowBody}>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
          </View>
          {starting === user.id ? <ActivityIndicator color={colors.accent} size="small" /> : null}
        </Pressable>
      ))}
    </FormModal>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 16 },
  empty: { textAlign: "center", color: colors.textDim, fontSize: 14, marginVertical: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  rowPressed: { backgroundColor: colors.cardMuted },
  rowBody: { flex: 1 },
  name: { fontWeight: "500", color: colors.text, fontSize: 15 },
  username: { fontSize: 12, color: colors.textDim, marginTop: 2 },
});
