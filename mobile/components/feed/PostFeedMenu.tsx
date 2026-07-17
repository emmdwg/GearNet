import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { api } from "../../lib/api";
import { sharePostToStory } from "../../lib/share-story";
import { useAuth } from "../../lib/auth";
import { colors } from "../../lib/theme";
import { SaveToCollectionModal } from "./SaveToCollectionModal";

type Props = {
  postId: string;
  authorId: string;
  authorUsername: string;
  onHidden?: () => void;
  onMuted?: () => void;
};

const REPORT_REASONS = ["spam", "harassment", "inappropriate", "scam", "other"] as const;

export function PostFeedMenu({ postId, authorId, authorUsername, onHidden, onMuted }: Props) {
  const { user } = useAuth();
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  if (!user) return null;

  function reportWithReason() {
    Alert.alert(
      "Report post",
      "Why are you reporting this?",
      [
        ...REPORT_REASONS.map((reason) => ({
          text: reason,
          onPress: () => {
            void api
              .reportPost(postId, reason)
              .then(() => Alert.alert("Thanks", "Report submitted."))
              .catch(() => Alert.alert("Error", "Couldn’t submit report."));
          },
        })),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  }

  function openMenu() {
    Alert.alert("Feed options", undefined, [
      { text: "Share to story", onPress: () => void sharePostToStory(postId, authorUsername) },
      { text: "Save to collection", onPress: () => setCollectionsOpen(true) },
      {
        text: "Hide post",
        onPress: () => {
          void api
            .hidePost(postId)
            .then(() => onHidden?.())
            .catch(() => Alert.alert("Error", "Couldn’t hide this post."));
        },
      },
      {
        text: `Mute @${authorUsername}`,
        onPress: () => {
          void api
            .muteUser(authorId)
            .then(() => onMuted?.())
            .catch(() => Alert.alert("Error", "Couldn’t mute this user."));
        },
      },
      {
        text: "Report post",
        style: "destructive",
        onPress: reportWithReason,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <>
      <Pressable onPress={openMenu} hitSlop={8} style={styles.btn} accessibilityLabel="Feed options">
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textDim} />
      </Pressable>
      <SaveToCollectionModal postId={postId} visible={collectionsOpen} onClose={() => setCollectionsOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
});
