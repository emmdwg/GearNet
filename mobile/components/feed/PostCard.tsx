import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Animated, Image, Pressable, Share, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRef, useState } from "react";
import type { Post } from "../../lib/types";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radii, spacing } from "../../lib/theme";
import { formatRelativeDate } from "../../lib/utils";
import type { RootStackParamList } from "../../navigation/types";
import { CreatePostForm } from "../forms/CreateForms";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { BookmarkButton } from "../ui/BookmarkButton";
import { OwnerActions } from "../ui/OwnerActions";
import { RichText } from "../ui/RichText";

type Props = {
  post: Post;
  onProfilePress?: (username: string) => void;
  onSignInRequired?: () => void;
  onOpen?: (postId: string) => void;
  onChanged?: () => void;
  initialBookmarked?: boolean;
  initialLiked?: boolean;
};

export function PostCard({
  post,
  onProfilePress,
  onSignInRequired,
  onOpen,
  onChanged,
  initialBookmarked,
  initialLiked = false,
}: Props) {
  const user = post.user;
  const { user: authUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const carouselWidth = width - spacing.lg * 2;
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(initialLiked);
  const [page, setPage] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const likeInFlight = useRef(false);
  const lastTap = useRef(0);
  const singleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;

  if (!user) return null;

  async function handleDelete() {
    try {
      await api.deletePost(post.id);
      onChanged?.();
    } catch {
      // ignore
    }
  }

  const images = post.images && post.images.length > 0 ? post.images : [post.image];

  async function toggleLikeRequest() {
    if (likeInFlight.current) return;
    likeInFlight.current = true;
    try {
      const result = await api.toggleLike("post", post.id);
      setLiked(result.liked);
      setLikes((n) => (result.liked ? n + 1 : Math.max(0, n - 1)));
    } catch {
      // ignore
    } finally {
      likeInFlight.current = false;
    }
  }

  async function handleLike() {
    if (!authUser) {
      onSignInRequired?.();
      return;
    }
    void toggleLikeRequest();
  }

  function playBurst() {
    burstScale.setValue(0.3);
    burstOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(burstScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(burstOpacity, { toValue: 0, duration: 600, delay: 250, useNativeDriver: true }),
    ]).start();
  }

  function handleImagePress() {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (singleTimer.current) clearTimeout(singleTimer.current);
      lastTap.current = 0;
      playBurst();
      if (!authUser) {
        onSignInRequired?.();
        return;
      }
      if (!liked) void toggleLikeRequest();
    } else {
      lastTap.current = now;
      singleTimer.current = setTimeout(() => onOpen?.(post.id), 280);
    }
  }

  async function handleShare() {
    try {
      await Share.share({ message: `${user!.displayName} on GearNet: ${post.caption}` });
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
        <View style={styles.headerText}>
          <Pressable onPress={onProfilePress ? () => onProfilePress(user.username) : undefined}>
            <Text style={styles.name}>{user.displayName}</Text>
          </Pressable>
          <Text style={styles.meta}>
            @{user.username} · {formatRelativeDate(post.createdAt)}
          </Text>
        </View>
        <OwnerActions
          ownerId={post.userId}
          entityLabel="post"
          onEdit={() => setEditOpen(true)}
          onDelete={handleDelete}
        />
      </View>

      <View>
        {images.length > 1 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                setPage(Math.round(x / carouselWidth));
              }}
              scrollEventThrottle={16}
            >
              {images.map((uri, i) => (
                <Pressable key={`${uri}-${i}`} onPress={handleImagePress}>
                  <Image
                    source={{ uri }}
                    style={[styles.image, { width: carouselWidth }]}
                    accessibilityLabel={post.caption}
                  />
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {page + 1}/{images.length}
              </Text>
            </View>
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
          </View>
        ) : (
          <Pressable onPress={handleImagePress}>
            <Image source={{ uri: images[0] }} style={styles.image} accessibilityLabel={post.caption} />
          </Pressable>
        )}
        <Animated.View
          pointerEvents="none"
          style={[styles.burst, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]}
        >
          <Ionicons name="heart" size={96} color="#fff" />
        </Animated.View>
      </View>

      <View style={styles.body}>
        <RichText
          text={post.caption}
          style={styles.caption}
          onPressTag={(t) => navigation.navigate("Tag", { tag: t })}
          onPressMention={(username) =>
            onProfilePress ? onProfilePress(username) : navigation.navigate("Profile", { username })
          }
        />
        <View style={styles.tags}>
          {post.tags.map((tag) => (
            <Pressable key={tag} onPress={() => navigation.navigate("Tag", { tag })}>
              <Badge variant="accent">{`#${tag}`}</Badge>
            </Pressable>
          ))}
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={handleLike}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={16} color={liked ? "#f87171" : colors.textDim} />
            <Text style={[styles.actionText, liked && { color: "#f87171" }]}>{likes}</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => onOpen?.(post.id)}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textDim} />
            <Text style={styles.actionText}>{post.comments}</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={handleShare}>
            <Ionicons name="share-outline" size={16} color={colors.textDim} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
          <View style={styles.spacer} />
          <BookmarkButton
            targetType="post"
            targetId={post.id}
            initialBookmarked={initialBookmarked}
            onSignInRequired={onSignInRequired}
          />
        </View>
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    color: colors.text,
    fontSize: 15,
  },
  meta: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  image: {
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: colors.border,
  },
  burst: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(9,9,11,0.6)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  counterText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  body: {
    padding: spacing.md,
    gap: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  spacer: { flex: 1 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: colors.textDim,
  },
});
