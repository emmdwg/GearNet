import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostMedia } from "../components/media/PostMedia";
import { CreatePostForm } from "../components/forms/CreateForms";
import { CommentThread } from "../components/social/CommentThread";
import { Avatar } from "../components/ui/Avatar";
import { RichText } from "../components/ui/RichText";
import { Badge } from "../components/ui/Badge";
import { BookmarkButton } from "../components/ui/BookmarkButton";
import { OwnerActions } from "../components/ui/OwnerActions";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, radii, spacing } from "../lib/theme";
import type { Post, PostDetail } from "../lib/types";
import { formatRelativeDate } from "../lib/utils";
import type { RootStackParamList } from "../navigation/types";

const IMAGE_HEIGHT = 360;

function toInitialDetail(post: Post): PostDetail {
  return {
    ...post,
    images: post.images && post.images.length > 0 ? post.images : [post.image],
    tags: post.tags ?? [],
    liked: false,
    commentList: [],
  };
}

export function PostViewerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "PostViewer">>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { postId, post: initialPost } = route.params;

  const [data, setData] = useState<PostDetail | null>(initialPost ? toInitialDetail(initialPost) : null);
  const [likes, setLikes] = useState(initialPost?.likes ?? 0);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(!initialPost);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const json = await api.getPostDetail(postId);
      setData(json);
      setLikes(json.likes ?? 0);
      setLiked(json.liked ?? false);
      return;
    } catch (e) {
      if (initialPost) {
        try {
          const commentList = await api.getComments("post", postId);
          setData({ ...toInitialDetail(initialPost), commentList });
        } catch {
          setData(toInitialDetail(initialPost));
        }
        return;
      }
      setLoadError(e instanceof Error ? e.message : "Failed to load post");
    }
  }, [postId, initialPost]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function toggleLike() {
    if (!user) {
      navigation.navigate("SignIn");
      return;
    }
    try {
      const result = await api.toggleLike("post", postId);
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
      await api.addComment("post", postId, comment.trim());
      const commentList = await api.getComments("post", postId);
      setData((prev) =>
        prev ? { ...prev, commentList, comments: (prev.comments ?? 0) + 1 } : prev
      );
      setComment("");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(parentId: string, content: string, quotedCommentId?: string) {
    if (!user) {
      navigation.navigate("SignIn");
      return;
    }
    await api.addComment("post", postId, content, parentId, quotedCommentId);
    const commentList = await api.getComments("post", postId);
    setData((prev) => (prev ? { ...prev, commentList, comments: (prev.comments ?? 0) + 1 } : prev));
  }

  async function likeComment(commentId: string) {
    if (!user) {
      navigation.navigate("SignIn");
      return { liked: false };
    }
    return api.toggleLike("comment", commentId);
  }

  async function deleteComment(commentId: string) {
    await api.deleteComment(commentId);
    const commentList = await api.getComments("post", postId);
    setData((prev) => (prev ? { ...prev, commentList } : prev));
  }

  async function handleDelete() {
    try {
      await api.deletePost(postId);
      navigation.goBack();
    } catch {
      // ignore
    }
  }

  function onImageScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    setPage(Math.round(x / screenWidth));
  }

  const imageSlideStyle = { width: screenWidth, height: IMAGE_HEIGHT };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (loadError || !data?.user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.loadError}>{loadError || "Post not found"}</Text>
        <Pressable onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const images = data.images?.length ? data.images : data.image ? [data.image] : [];
  const tags = data.tags ?? [];
  const commentList = data.commentList ?? [];

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
            <Text style={styles.userHandle}>
              @{data.user.username} · {formatRelativeDate(data.createdAt)}
            </Text>
          </View>
        </Pressable>
        <OwnerActions
          ownerId={data.userId}
          entityLabel="post"
          onEdit={() => setEditOpen(true)}
          onDelete={handleDelete}
        />
      </View>

      <View style={styles.imageSection}>
        <PostMedia post={data} variant="viewer" width={screenWidth} />
      </View>

      <View style={styles.captionWrap}>
        <RichText
          text={data.caption}
          style={styles.caption}
          onPressTag={(t) => navigation.navigate("Tag", { tag: t })}
          onPressMention={(username) => navigation.navigate("Profile", { username })}
        />
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((t) => (
              <Pressable key={t} onPress={() => navigation.navigate("Tag", { tag: t })}>
                <Badge variant="accent">{`#${t}`}</Badge>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.comments} contentContainerStyle={styles.commentsContent}>
        <CommentThread
          comments={commentList}
          currentUserId={user?.id}
          onReply={submitReply}
          onLike={likeComment}
          onDelete={user ? deleteComment : undefined}
          onSignInRequired={!user ? () => navigation.navigate("SignIn") : undefined}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.stats}>
          <Pressable style={styles.stat} onPress={toggleLike}>
            <Ionicons name={liked ? "flame" : "flame-outline"} size={18} color={liked ? colors.accent : colors.textDim} />
            <Text style={[styles.statText, liked && { color: colors.danger }]}>{likes}</Text>
          </Pressable>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textDim} />
            <Text style={styles.statText}>{data.comments ?? commentList.length}</Text>
          </View>
          <BookmarkButton
            targetType="post"
            targetId={postId}
            initialBookmarked={data.bookmarked}
            showLabel
            onSignInRequired={() => navigation.navigate("SignIn")}
          />
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
      <CreatePostForm
        visible={editOpen}
        editing={data}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          load();
        }}
      />
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
  imageSection: {
    height: IMAGE_HEIGHT,
    backgroundColor: "#000",
    position: "relative",
  },
  imageSlide: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  imageMissing: { backgroundColor: colors.border },
  imageMissingText: { color: colors.textDim, fontSize: 13 },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: { backgroundColor: colors.accent },
  counter: {
    position: "absolute",
    top: 12,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterText: { color: "#fff", fontSize: 12 },
  captionWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: 8 },
  caption: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  comments: { flex: 1, marginTop: spacing.sm },
  commentsContent: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  emptyComments: { fontSize: 13, color: colors.textFaint },
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
  loadError: { color: colors.textDim, fontSize: 14, textAlign: "center", marginTop: spacing.lg },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  retryText: { color: colors.text, fontSize: 14 },
});
