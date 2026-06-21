import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { colors, radii, spacing } from "../../lib/theme";
import type { User } from "../../lib/types";
import { Avatar } from "../ui/Avatar";
import { FollowButton } from "./FollowButton";

type Props = {
  onProfilePress?: (username: string) => void;
  onSignInRequired?: () => void;
};

export function SuggestedBuilders({ onProfilePress, onSignInRequired }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .getSuggestedUsers()
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || users.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Suggested builders to follow</Text>
      {users.map((u) => (
        <View key={u.id} style={styles.row}>
          <Pressable style={styles.user} onPress={() => onProfilePress?.(u.username)}>
            <Avatar src={u.avatar} alt={u.displayName} size="sm" />
            <View style={styles.userText}>
              <Text style={styles.name} numberOfLines={1}>
                {u.displayName}
              </Text>
              <Text style={styles.handle} numberOfLines={1}>
                @{u.username}
              </Text>
            </View>
          </Pressable>
          <FollowButton
            userId={u.id}
            username={u.username}
            initialFollowing={false}
            size="sm"
            onSignInRequired={onSignInRequired}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  title: { fontSize: 15, fontWeight: "600", color: colors.text },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  user: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  userText: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  handle: { fontSize: 12, color: colors.textDim },
});
