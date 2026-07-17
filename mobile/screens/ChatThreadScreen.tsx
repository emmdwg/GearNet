import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VoiceNotePlayer } from "../components/chat/VoiceNotePlayer";
import { UserSafetySheet } from "../components/social/UserSafetySheet";
import { Avatar } from "../components/ui/Avatar";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { parseMessageContent } from "../lib/chat-content";
import { getLatestOutgoingDeliveryStatus } from "../lib/chat-delivery";
import { pickAndUploadImage, uploadAudio } from "../lib/upload";
import { Audio } from "expo-av";
import { conversationChannelId } from "../lib/realtime-shared";
import { supabase } from "../lib/supabase";
import { colors, radii, spacing } from "../lib/theme";
import type { Message } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function ChatThreadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ChatThread">>();
  const { conversationId, otherUser, groupName, isGroup } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data.messages);
      setOtherLastReadAt(data.otherLastReadAt);
      setLoadError("");
    } catch (e) {
      setMessages([]);
      setOtherLastReadAt(null);
      setLoadError(e instanceof Error ? e.message : "Could not load messages");
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages().finally(() => setLoading(false));
  }, [loadMessages]);

  useEffect(() => {
    if (otherUser || groupName) return;
    api
      .getConversation(conversationId)
      .then((conv) => {
        navigation.setParams({
          otherUser: conv.otherUser ?? undefined,
          groupName: conv.groupName,
          isGroup: conv.type === "club" || conv.type === "event",
        });
      })
      .catch(() => {});
  }, [conversationId, otherUser, groupName, navigation]);

  useEffect(() => {
    const channel = supabase
      .channel(conversationChannelId(conversationId))
      .on("broadcast", { event: "new-message" }, ({ payload }) => {
        const nudge = payload as { id: string; senderId: string; content?: string; sentAt: string };
        if (nudge.content) {
          const message = payload as Message;
          setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        } else {
          void loadMessages();
        }
        if (nudge.senderId !== user?.id) {
          void api.markConversationRead(conversationId).then((data) => {
            setOtherLastReadAt(data.otherLastReadAt);
          });
        }
      })
      .on("broadcast", { event: "read-receipt" }, ({ payload }) => {
        const receipt = payload as { userId: string; readAt: string };
        if (!user?.id || receipt.userId === user.id) return;
        setOtherLastReadAt((prev) => {
          if (!prev || new Date(receipt.readAt) > new Date(prev)) return receipt.readAt;
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, loadMessages]);

  const sendMessage = async (imageUrl?: string, audioUrl?: string) => {
    if ((!input.trim() && !imageUrl && !audioUrl) || sending) return;
    setSending(true);
    setSendError("");
    try {
      const message = await api.sendMessage(conversationId, input.trim(), imageUrl, audioUrl);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      if (message.otherLastReadAt !== undefined) {
        setOtherLastReadAt(message.otherLastReadAt ?? null);
      }
      setInput("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    setUploadingImage(true);
    setSendError("");
    try {
      const url = await pickAndUploadImage("chat");
      if (url) await sendMessage(url);
    } catch {
      setSendError("Couldn’t upload photo. Try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      setUploadingAudio(true);
      setSendError("");
      try {
        await recording.stopAndUnloadAsync();
        const status = await recording.getStatusAsync();
        const uri = recording.getURI();
        setRecording(null);
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        if (!uri) return;
        const duration =
          status.isRecording === false && "durationMillis" in status && typeof status.durationMillis === "number"
            ? status.durationMillis / 1000
            : undefined;
        if (duration != null && duration < 0.5) {
          setSendError("Hold a bit longer to record a voice note.");
          return;
        }
        const url = await uploadAudio(uri, duration, "chat");
        await sendMessage(undefined, url);
      } catch {
        setRecording(null);
        setSendError("Couldn’t send voice note. Try again.");
      } finally {
        setUploadingAudio(false);
      }
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setSendError("Microphone permission is required for voice notes.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const next = new Audio.Recording();
      await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await next.startAsync();
      setRecording(next);
    } catch {
      setSendError("Couldn’t start recording. Try again.");
    }
  };

  useEffect(() => {
    return () => {
      void recording?.stopAndUnloadAsync();
    };
  }, [recording]);

  const deliveryStatus = useMemo(() => {
    if (!user?.id) return null;
    const last = messages[messages.length - 1];
    const lastIsMine = !last || last.senderId === user.id;
    if (sending && lastIsMine) return "Sending…" as const;
    return getLatestOutgoingDeliveryStatus(messages, user.id, otherLastReadAt);
  }, [messages, user?.id, otherLastReadAt, sending]);

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
        <Pressable
          style={styles.headerIdentity}
          disabled={isGroup || !otherUser?.username}
          onPress={() => {
            if (!isGroup && otherUser?.username) {
              navigation.navigate("Profile", { username: otherUser.username });
            }
          }}
        >
          {isGroup ? (
            <View style={styles.groupAvatar}>
              <Ionicons name="people" size={18} color={colors.accent} />
            </View>
          ) : (
            <Avatar src={otherUser?.avatar ?? ""} alt={otherUser?.displayName ?? groupName ?? "Chat"} size="sm" />
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{isGroup ? (groupName ?? "Crew chat") : otherUser?.displayName}</Text>
            <Text style={styles.headerHandle}>
              {isGroup ? "Crew chat" : `@${otherUser?.username}`}
            </Text>
          </View>
        </Pressable>
        {!isGroup && otherUser ? (
          <Pressable onPress={() => setSafetyOpen(true)} hitSlop={8} style={styles.moreBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textDim} />
          </Pressable>
        ) : null}
      </View>

      {loadError ? <Text style={styles.errorBanner}>{loadError}</Text> : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={
          !isGroup && deliveryStatus ? <Text style={styles.deliveryStatus}>{deliveryStatus}</Text> : null
        }
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.id;
          const parsed = parseMessageContent(item.content);
          const senderName = item.sender?.displayName;
          return (
            <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowOther]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                {isGroup && !isMe && senderName ? (
                  <Text style={styles.senderLabel}>{senderName}</Text>
                ) : null}
                {parsed.imageUrl ? (
                  <Image source={{ uri: parsed.imageUrl }} style={styles.bubbleImage} resizeMode="cover" />
                ) : null}
                {parsed.audioUrl ? <VoiceNotePlayer audioUrl={parsed.audioUrl} isMe={isMe} /> : null}
                {parsed.text ? (
                  <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                    {parsed.text}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {sendError ? <Text style={styles.errorBanner}>{sendError}</Text> : null}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.imageBtn} onPress={() => void sendImage()} disabled={uploadingImage || sending || Boolean(recording)}>
          <Ionicons name="image-outline" size={22} color={colors.textDim} />
        </Pressable>
        <Pressable
          style={[styles.imageBtn, recording && styles.recordingBtn]}
          onPress={() => void toggleRecording()}
          disabled={uploadingAudio || sending || uploadingImage}
        >
          <Ionicons name={recording ? "stop-circle" : "mic-outline"} size={22} color={recording ? "#f87171" : colors.textDim} />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={recording ? "Recording…" : "Type a message..."}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          editable={!recording}
          returnKeyType="send"
          onSubmitEditing={() => void sendMessage()}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || sending || recording || uploadingImage || uploadingAudio) && styles.sendBtnDisabled]}
          onPress={() => void sendMessage()}
          disabled={!input.trim() || sending || Boolean(recording) || uploadingImage || uploadingAudio}
        >
          <Ionicons name="send" size={18} color={colors.accentText} />
        </Pressable>
      </View>
      {!isGroup && otherUser ? (
        <UserSafetySheet
          userId={otherUser.id}
          username={otherUser.username}
          visible={safetyOpen}
          onClose={() => setSafetyOpen(false)}
          onBlocked={() => navigation.goBack()}
        />
      ) : null}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(39,39,42,0.7)",
    backgroundColor: colors.background,
  },
  backBtn: { padding: 4 },
  moreBtn: { padding: 4 },
  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  groupAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(39,39,42,0.7)",
  },
  errorBanner: {
    color: "#f87171",
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  headerText: { flex: 1, minWidth: 0 },
  headerName: { fontWeight: "500", color: colors.text, fontSize: 15 },
  headerHandle: { fontSize: 12, color: colors.textDim },
  messages: { padding: spacing.lg, gap: 8, flexGrow: 1 },
  bubbleRow: { flexDirection: "row", marginBottom: 8 },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubbleRowOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: radii.xl, paddingHorizontal: 16, paddingVertical: 10 },
  bubbleMe: { backgroundColor: colors.accent },
  bubbleOther: { backgroundColor: "rgba(39,39,42,0.85)" },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: colors.accentText },
  bubbleTextOther: { color: colors.textMuted },
  senderLabel: { fontSize: 10, fontWeight: "600", color: colors.accent, marginBottom: 4 },
  bubbleImage: { width: 180, height: 140, borderRadius: radii.md, marginBottom: 6 },
  deliveryStatus: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 8,
    paddingRight: 4,
    fontSize: 11,
    color: colors.textDim,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(39,39,42,0.7)",
    backgroundColor: colors.background,
  },
  imageBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(39,39,42,0.7)",
  },
  recordingBtn: {
    backgroundColor: "rgba(248,113,113,0.12)",
    borderColor: "rgba(248,113,113,0.4)",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(39,39,42,0.8)",
    borderRadius: 999,
    backgroundColor: "rgba(24,24,27,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});
