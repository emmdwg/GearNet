import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Animated, Alert, Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRef, useState } from "react";
import { REACTION_TYPES, reactionEmoji, type ReactionType } from "../../lib/reactions";
import type { Post } from "../../lib/types";
import { api, API_URL } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, spacing } from "../../lib/theme";
import { formatRelativeDate } from "../../lib/utils";
import type { RootStackParamList } from "../../navigation/types";
import { CreatePostForm } from "../forms/CreateForms";
import { PostMedia } from "../media/PostMedia";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { BookmarkButton } from "../ui/BookmarkButton";
import { OwnerActions } from "../ui/OwnerActions";
import { PostFeedMenu } from "./PostFeedMenu";
import { RichText } from "../ui/RichText";

type Props = {
  post: Post;
  onProfilePress?: (username: string) => void;
  onSignInRequired?: () => void;
  onOpen?: (postId: string) => void;
  onChanged?: () => void;
  onHidden?: () => void;
  onMuted?: () => void;
  initialBookmarked?: boolean;
  initialLiked?: boolean;
};

export function PostCard({
  post,
  onProfilePress,
  onSignInRequired,
  onOpen,
  onChanged,
  onHidden,
  onMuted,
  initialBookmarked,
  initialLiked = false,
}: Props) {
  const user = post.user;
  const { user: authUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const [likes, setLikes] = useState(post.likes);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    post.userReaction ?? (initialLiked ? "like" : null),
  );
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts ?? {});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const likeInFlight = useRef(false);
  const lastTap = useRef(0);
  const singleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;

  if (!user) return null;

  const collabNames = post.collaborators ?? [];
  const isCollab = post.postType === "collab" || collabNames.length > 0;
  const collabByUsername = new Map(
    (post.collaboratorUsers ?? []).map((u) => [u.username.replace(/^@/, "").toLowerCase(), u]),
  );
  const collabEntries = collabNames.map((name, i) => {
    const username = name.replace(/^@/, "");
    const resolved = collabByUsername.get(username.toLowerCase());
    const isUsername = /^[a-zA-Z0-9_]{2,30}$/.test(username);
    return {
      key: `${name}-${i}`,
      username,
      isUsername,
      displayName: resolved?.displayName,
      avatar: resolved?.avatar?.trim() || "",
      raw: name,
    };
  });

  function goToProfile(username: string) {
    if (onProfilePress) onProfilePress(username);
    else navigation.navigate("Profile", { username });
  }

  async function handleDelete() {
    try {
      await api.deletePost(post.id);
      onChanged?.();
    } catch {
      Alert.alert("Error", "Couldn’t delete this post.");
    }
  }

  async function handleReaction(type: ReactionType) {
    if (!authUser) {
      onSignInRequired?.();
      return;
    }
    if (likeInFlight.current) return;
    likeInFlight.current = true;
    try {
      const result = await api.setReaction("post", post.id, type);
      const prev = userReaction;
      setUserReaction((result.reactionType as ReactionType | null) ?? null);
      setReactionCounts((counts) => {
        const next = { ...counts };
        if (prev && next[prev]) next[prev] = Math.max(0, (next[prev] ?? 0) - 1);
        if (result.reactionType) {
          const rt = result.reactionType as ReactionType;
          next[rt] = (next[rt] ?? 0) + 1;
        }
        return next;
      });
      setLikes((n) => {
        if (prev && !result.reactionType) return Math.max(0, n - 1);
        if (!prev && result.reactionType) return n + 1;
        return n;
      });
    } catch {
      Alert.alert("Error", "Couldn’t update reaction.");
    } finally {
      likeInFlight.current = false;
      setPickerOpen(false);
    }
  }

  async function handleLike() {
    void handleReaction(userReaction ? userReaction : "like");
  }

  function playBurst() {
    burstScale.setValue(0.3);
    burstOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(burstScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(burstOpacity, { toValue: 0, duration: 600, delay: 250, useNativeDriver: true }),
    ]).start();
  }

  function handleMediaPress() {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (singleTimer.current) clearTimeout(singleTimer.current);
      lastTap.current = 0;
      playBurst();
      if (!authUser) {
        onSignInRequired?.();
        return;
      }
      if (!userReaction) void handleReaction("like");
    } else {
      lastTap.current = now;
      singleTimer.current = setTimeout(() => onOpen?.(post.id), 280);
    }
  }

  async function handleShare() {
    const url = `${API_URL.replace(/\/$/, "")}/post/${post.id}`;
    try {
      await Share.share({
        message: `${user!.displayName} on GearNet: ${post.caption}\n${url}`,
        url,
      });
    } catch {
      // cancelled
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar
          src={user.avatar}
          alt={user.displayName}
          onPress={onProfilePress ? () => onProfilePress(user.username) : undefined}
        />
        <Pressable
          style={styles.headerText}
          onPress={onProfilePress ? () => onProfilePress(user.username) : undefined}
        >
          <Text style={styles.username}>{user.username}</Text>
          {post.isSponsored ? (
            <Text style={styles.sponsored}>
              Paid partnership{post.sponsorName ? ` · ${post.sponsorName}` : ""}
            </Text>
          ) : null}
          {post.vehicleRef ? <Text style={styles.vehicleRef}>{post.vehicleRef}</Text> : null}
        </Pressable>
        <OwnerActions
          ownerId={post.userId}
          entityLabel="post"
          onEdit={() => setEditOpen(true)}
          onDelete={handleDelete}
        />
        {authUser && authUser.id !== post.userId ? (
          <PostFeedMenu
            postId={post.id}
            authorId={post.userId}
            authorUsername={user.username}
            onHidden={onHidden}
            onMuted={onMuted}
          />
        ) : null}
      </View>

      <View style={styles.mediaWrap}>
        <PostMedia post={post} width={width} onPress={handleMediaPress} />
        {post.dynoHighlight ? (
          <View style={styles.dynoBadge}>
            <Text style={styles.dynoText}>{post.dynoHighlight}</Text>
          </View>
        ) : null}
        <Animated.View
          pointerEvents="none"
          style={[styles.burst, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]}
        >
          <Ionicons name="flame" size={96} color={colors.accent} />
        </Animated.View>
      </View>

      <View style={styles.body}>
        <View style={styles.actions}>
          <Pressable onPress={() => setPickerOpen((v) => !v)} onLongPress={handleLike} hitSlop={8}>
            <Text style={styles.reactionEmoji}>{userReaction ? reactionEmoji(userReaction) : "🔥"}</Text>
          </Pressable>
          {pickerOpen ? (
            <View style={styles.reactionPicker}>
              {REACTION_TYPES.map((r) => (
                <Pressable key={r.type} onPress={() => void handleReaction(r.type)} hitSlop={4}>
                  <Text style={styles.pickerEmoji}>{r.emoji}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Pressable onPress={() => onOpen?.(post.id)} hitSlop={8} style={styles.actionGap}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleShare} hitSlop={8} style={styles.actionGap}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.spacer} />
          <BookmarkButton
            targetType="post"
            targetId={post.id}
            initialBookmarked={initialBookmarked}
            onSignInRequired={onSignInRequired}
          />
        </View>

        {likes > 0 ? (
          <Text style={styles.likes}>
            {likes.toLocaleString()} {likes === 1 ? "reaction" : "reactions"}
          </Text>
        ) : null}
        {REACTION_TYPES.filter((r) => (reactionCounts[r.type] ?? 0) > 0).length > 0 ? (
          <Text style={styles.reactionCounts}>
            {REACTION_TYPES.filter((r) => (reactionCounts[r.type] ?? 0) > 0)
              .map((r) => `${r.emoji} ${reactionCounts[r.type]}`)
              .join("  ")}
          </Text>
        ) : null}

        {isCollab ? (
          <View style={styles.crewBlock}>
            <View style={styles.crewRow}>
              <Badge variant="accent">Build crew</Badge>
              {collabEntries.some((c) => c.avatar) ? (
                <View style={styles.avatarStack}>
                  {collabEntries
                    .filter((c) => c.avatar && c.isUsername)
                    .slice(0, 5)
                    .map((c, i) => (
                      <Pressable
                        key={c.key}
                        onPress={() => goToProfile(c.username)}
                        style={[styles.stackAvatar, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}
                      >
                        <Avatar src={c.avatar} alt={c.displayName || c.username} size="sm" />
                      </Pressable>
                    ))}
                </View>
              ) : null}
              {collabEntries.filter((c) => !c.avatar).length > 0 ? (
                <View style={styles.collabUsernames}>
                  {collabEntries
                    .filter((c) => !c.avatar)
                    .map((c) =>
                      c.isUsername ? (
                        <Pressable key={c.key} onPress={() => goToProfile(c.username)}>
                          <Text style={styles.collabLink}>@{c.username}</Text>
                        </Pressable>
                      ) : (
                        <Text key={c.key} style={styles.collaborators}>
                          {c.raw}
                        </Text>
                      ),
                    )}
                </View>
              ) : null}
            </View>
            {collabEntries.length > 0 ? (
              <Text style={styles.collaborators}>
                With{" "}
                {collabEntries.map((c, i) => (
                  <Text key={c.key}>
                    {i > 0 ? ", " : ""}
                    {c.isUsername ? (
                      <Text style={styles.collabLink} onPress={() => goToProfile(c.username)}>
                        @{c.username}
                      </Text>
                    ) : (
                      c.raw
                    )}
                  </Text>
                ))}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.caption}>
          <Text style={styles.captionUser}>{user.username} </Text>
          <RichText
            text={post.caption ?? ""}
            style={styles.captionText}
            onPressTag={(t) => navigation.navigate("Tag", { tag: t })}
            onPressMention={(username) =>
              onProfilePress ? onProfilePress(username) : navigation.navigate("Profile", { username })
            }
          />
        </Text>

        {post.postType === "before-after" ? (
          <View style={styles.typeBadge}>
            <Badge variant="outline">Before/After</Badge>
          </View>
        ) : null}
        {post.audioUrl ? (
          <View style={styles.typeBadge}>
            <Badge variant="outline">Audio</Badge>
          </View>
        ) : null}

        {(post.tags ?? []).length > 0 ? (
          <View style={styles.tags}>
            {(post.tags ?? []).map((tag) => (
              <Pressable key={tag} onPress={() => navigation.navigate("Tag", { tag })}>
                <Badge variant="accent">{`#${tag}`}</Badge>
              </Pressable>
            ))}
          </View>
        ) : null}

        {post.comments > 0 ? (
          <Pressable onPress={() => onOpen?.(post.id)}>
            <Text style={styles.viewComments}>View all {post.comments} comments</Text>
          </Pressable>
        ) : null}

        <Text style={styles.time}>{formatRelativeDate(post.createdAt)}</Text>
      </View>

      <CreatePostForm
        visible={editOpen}
        editing={post}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          onChanged?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  headerText: { flex: 1 },
  username: { fontWeight: "600", color: colors.text, fontSize: 14 },
  sponsored: { color: "#fbbf24", fontSize: 11, fontWeight: "500", marginTop: 1 },
  vehicleRef: { fontSize: 11, color: colors.textDim, marginTop: 1 },
  typeBadge: { marginTop: 4 },
  mediaWrap: { position: "relative" },
  dynoBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dynoText: { fontSize: 11, color: colors.accent, fontWeight: "600" },
  reactionEmoji: { fontSize: 26 },
  reactionPicker: {
    flexDirection: "row",
    gap: 6,
    marginLeft: 8,
    backgroundColor: colors.cardMuted,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerEmoji: { fontSize: 20 },
  reactionCounts: { fontSize: 12, color: colors.textDim },
  burst: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: spacing.md,
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  actionGap: { marginLeft: 16 },
  spacer: { flex: 1 },
  likes: { fontSize: 14, fontWeight: "600", color: colors.text },
  caption: { fontSize: 14, lineHeight: 20 },
  crewBlock: { gap: 6, marginBottom: 2 },
  crewRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  avatarStack: { flexDirection: "row", alignItems: "center", paddingLeft: 2 },
  stackAvatar: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.background,
  },
  collabUsernames: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  collaborators: { fontSize: 12, color: colors.textDim, marginBottom: 4 },
  collabLink: { color: colors.accent },
  captionUser: { fontWeight: "600", color: colors.text },
  captionText: { color: colors.textMuted },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  viewComments: { fontSize: 14, color: colors.textDim },
  time: {
    fontSize: 11,
    color: colors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 2,
  },
});
