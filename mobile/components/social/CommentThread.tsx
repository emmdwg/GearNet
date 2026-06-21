import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "../../lib/theme";
import type { Comment } from "../../lib/types";
import { formatRelativeDate } from "../../lib/utils";
import type { RootStackParamList } from "../../navigation/types";

type Props = {
  comments: Comment[];
  onReply: (parentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<{ liked: boolean }>;
  onSignInRequired?: () => void;
};

export function CommentThread({ comments, onReply, onLike, onSignInRequired }: Props) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReply() {
    if (!replyTo || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(replyTo, replyText.trim());
      setReplyText("");
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (comments.length === 0) {
    return <Text style={styles.empty}>No comments yet. Be the first to comment.</Text>;
  }

  return (
    <View style={styles.wrap}>
      {comments.map((item) => (
        <CommentNode
          key={item.id}
          item={item}
          depth={0}
          replyTo={replyTo}
          replyText={replyText}
          submitting={submitting}
          onSetReplyTo={setReplyTo}
          onSetReplyText={setReplyText}
          onSubmitReply={submitReply}
          onLike={onLike}
          onSignInRequired={onSignInRequired}
        />
      ))}
    </View>
  );
}

function CommentNode({
  item,
  depth,
  replyTo,
  replyText,
  submitting,
  onSetReplyTo,
  onSetReplyText,
  onSubmitReply,
  onLike,
  onSignInRequired,
}: {
  item: Comment;
  depth: number;
  replyTo: string | null;
  replyText: string;
  submitting: boolean;
  onSetReplyTo: (id: string | null) => void;
  onSetReplyText: (text: string) => void;
  onSubmitReply: () => void;
  onLike: (commentId: string) => Promise<{ liked: boolean }>;
  onSignInRequired?: () => void;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [likes, setLikes] = useState(item.likes ?? 0);
  const [liked, setLiked] = useState(item.liked ?? false);

  async function handleLike() {
    if (onSignInRequired) {
      onSignInRequired();
      return;
    }
    try {
      const result = await onLike(item.id);
      setLiked(result.liked);
      setLikes((n) => (result.liked ? n + 1 : Math.max(0, n - 1)));
    } catch {
      // ignore
    }
  }

  return (
    <View style={[depth > 0 && styles.replyIndent]}>
      <Text style={styles.commentText}>
        <Text
          style={styles.commentAuthor}
          onPress={() => navigation.navigate("Profile", { username: item.user.username })}
        >
          {item.user.displayName}
        </Text>{" "}
        {item.content}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.commentTime}>{formatRelativeDate(item.createdAt)}</Text>
        <Pressable style={styles.metaBtn} onPress={handleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={12} color={liked ? colors.danger : colors.textFaint} />
          <Text style={[styles.metaText, liked && { color: colors.danger }]}>{likes > 0 ? likes : "Like"}</Text>
        </Pressable>
        <Pressable style={styles.metaBtn} onPress={() => onSetReplyTo(replyTo === item.id ? null : item.id)}>
          <Text style={styles.metaText}>Reply</Text>
        </Pressable>
      </View>
      {replyTo === item.id ? (
        <View style={styles.replyInputRow}>
          <TextInput
            value={replyText}
            onChangeText={onSetReplyText}
            placeholder={`Reply to ${item.user.displayName}...`}
            placeholderTextColor={colors.textFaint}
            style={styles.replyInput}
            onSubmitEditing={() => !submitting && onSubmitReply()}
          />
          <Pressable style={styles.replySend} onPress={onSubmitReply} disabled={submitting}>
            <Text style={styles.replySendText}>Post</Text>
          </Pressable>
        </View>
      ) : null}
      {item.replies?.map((reply) => (
        <CommentNode
          key={reply.id}
          item={reply}
          depth={depth + 1}
          replyTo={replyTo}
          replyText={replyText}
          submitting={submitting}
          onSetReplyTo={onSetReplyTo}
          onSetReplyText={onSetReplyText}
          onSubmitReply={onSubmitReply}
          onLike={onLike}
          onSignInRequired={onSignInRequired}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  empty: { fontSize: 13, color: colors.textFaint },
  replyIndent: { marginLeft: 16, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 10, marginTop: 8 },
  commentText: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  commentAuthor: { fontWeight: "600", color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  commentTime: { fontSize: 10, color: colors.textFaint },
  metaBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: colors.textFaint },
  replyInputRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  replyInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.text,
    fontSize: 12,
  },
  replySend: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  replySendText: { fontSize: 12, fontWeight: "600", color: colors.accentText },
});
