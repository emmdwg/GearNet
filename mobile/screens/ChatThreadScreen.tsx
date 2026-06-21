import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../components/ui/Avatar";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { conversationChannelId } from "../lib/realtime-shared";
import { supabase } from "../lib/supabase";
import { colors, radii, spacing } from "../lib/theme";
import type { Message } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function ChatThreadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ChatThread">>();
  const { conversationId, otherUser } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await api.getMessages(conversationId));
    } catch {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages().finally(() => setLoading(false));
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(conversationChannelId(conversationId))
      .on("broadcast", { event: "new-message" }, ({ payload }) => {
        const message = payload as Message;
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const message = await api.sendMessage(conversationId, input.trim());
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setInput("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState message="Loading chat..." />;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Avatar src={otherUser.avatar} alt={otherUser.displayName} size="sm" />
        <View style={styles.headerText}>
          <Text style={styles.headerName}>{otherUser.displayName}</Text>
          <Text style={styles.headerHandle}>@{otherUser.username}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.id;
          return (
            <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowOther]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          <Ionicons name="send" size={18} color={colors.accentText} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backBtn: { padding: 4 },
  headerText: { flex: 1 },
  headerName: { fontWeight: "500", color: colors.text, fontSize: 15 },
  headerHandle: { fontSize: 12, color: colors.textDim },
  messages: { padding: spacing.lg, gap: 8, flexGrow: 1 },
  bubbleRow: { flexDirection: "row", marginBottom: 8 },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubbleRowOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: radii.xl, paddingHorizontal: 16, paddingVertical: 10 },
  bubbleMe: { backgroundColor: colors.accent },
  bubbleOther: { backgroundColor: colors.border },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: colors.accentText },
  bubbleTextOther: { color: colors.textMuted },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});
