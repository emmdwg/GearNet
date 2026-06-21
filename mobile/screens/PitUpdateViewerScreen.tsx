import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../components/ui/Avatar";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, radii, spacing } from "../lib/theme";
import type { PitUpdateDetail } from "../lib/types";
import { formatRelativeDate } from "../lib/utils";
import type { RootStackParamList } from "../navigation/types";

export function PitUpdateViewerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "PitUpdateViewer">>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { updateId } = route.params;

  const [data, setData] = useState<PitUpdateDetail | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const json = await api.getPitUpdateDetail(updateId);
    setData(json);
    setLikes(json.likes ?? 0);
    setLiked(json.liked ?? false);
  }, [updateId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function toggleLike() {
    if (!user) {
      navigation.navigate("SignIn");
      return;
    }
    try {
      const result = await api.toggleLike("pit_update", updateId);
      setLiked(result.liked);
      setLikes((n) => (result.liked ? n + 1 : Math.max(0, n - 1)));
    } catch {
      // ignore
    }
  }

  async function submitComment() {
    if (!comment.trim()) return;
    if (!user) {
      navigation.navigate("SignIn");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.addComment("pit_update", updateId, comment.trim());
      setData((prev) =>
        prev
          ? {
              ...prev,
              commentList: [...prev.commentList, created],
              comments: (prev.comments ?? 0) + 1,
            }
          : prev
      );
      setComment("");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !data?.user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.userRow}
          onPress={() => navigation.navigate("Profile", { username: data.user!.username })}
        >
          <Avatar src={data.user.avatar} alt={data.user.displayName} size="sm" />
          <View>
            <Text style={styles.userName}>{data.user.displayName}</Text>
            <Text style={styles.userHandle}>@{data.user.username}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.imageWrap}>
        <Image source={{ uri: data.image }} style={styles.image} resizeMode="contain" />
      </View>

      {data.caption ? (
        <View style={styles.captionWrap}>
          <Text style={styles.caption}>{data.caption}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.comments} contentContainerStyle={styles.commentsContent}>
        {data.commentList.map((item) => (
          <View key={item.id} style={styles.commentItem}>
            <Text style={styles.commentText}>
              <Text style={styles.commentAuthor}>{item.user.displayName}</Text> {item.content}
            </Text>
            <Text style={styles.commentTime}>{formatRelativeDate(item.createdAt)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.stats}>
          <Pressable style={styles.stat} onPress={toggleLike}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? colors.danger : colors.textDim} />
            <Text style={[styles.statText, liked && { color: colors.danger }]}>{likes}</Text>
          </Pressable>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textDim} />
            <Text style={styles.statText}>{data.comments ?? data.commentList.length}</Text>
          </View>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            onSubmitEditing={submitComment}
            returnKeyType="send"
          />
          <Pressable style={styles.sendBtn} onPress={submitComment} disabled={submitting}>
            <Ionicons name="send" size={16} color={colors.accentText} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  userRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  userName: { fontWeight: "600", color: colors.text, fontSize: 14 },
  userHandle: { fontSize: 11, color: colors.textDim },
  imageWrap: {
    flex: 1,
    minHeight: 240,
    backgroundColor: "#000",
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  captionWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  caption: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  comments: { maxHeight: 160, marginTop: spacing.sm },
  commentsContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  commentItem: { marginBottom: 4 },
  commentText: { fontSize: 13, color: colors.textMuted },
  commentAuthor: { fontWeight: "600", color: colors.text },
  commentTime: { fontSize: 10, color: colors.textFaint, marginTop: 2 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  stats: { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.sm },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 13, color: colors.textDim },
  inputRow: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
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
});
