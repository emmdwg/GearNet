import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PitUpdate } from "../../lib/types";
import { colors, radii, spacing } from "../../lib/theme";
import { Avatar } from "../ui/Avatar";

export function PitUpdateStrip({
  updates,
  onAdd,
  onProfilePress,
  onUpdatePress,
}: {
  updates: PitUpdate[];
  onAdd?: () => void;
  onProfilePress?: (username: string) => void;
  onUpdatePress?: (updateId: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>PIT UPDATES</Text>
        <Text style={styles.hint}>24h snapshots from the garage</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {updates.map((update) => {
          const user = update.user;
          if (!user) return null;
          return (
            <Pressable key={update.id} style={styles.item} onPress={() => onUpdatePress?.(update.id)}>
              <View style={styles.thumbWrap}>
                <Image source={{ uri: update.image }} style={styles.thumb} />
                <View style={styles.thumbOverlay}>
                  <Text style={styles.thumbCaption} numberOfLines={2}>
                    {update.caption}
                  </Text>
                </View>
              </View>
              <View style={styles.userRow}>
                <Avatar src={user.avatar} alt={user.displayName} size="sm" />
                <Text style={styles.userName} numberOfLines={1}>
                  {user.displayName.split(" ")[0]}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable style={styles.addItem} onPress={onAdd}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addLabel}>Add update</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    color: colors.textDim,
  },
  hint: {
    fontSize: 11,
    color: colors.textFaint,
  },
  strip: {
    gap: 12,
    paddingBottom: 4,
  },
  item: {
    width: 96,
  },
  thumbWrap: {
    height: 144,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.5)",
    backgroundColor: colors.border,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  thumbCaption: {
    fontSize: 10,
    color: colors.text,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  userName: {
    flex: 1,
    fontSize: 11,
    color: colors.textDim,
  },
  addItem: {
    width: 96,
    height: 144,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    fontSize: 24,
    color: colors.textFaint,
  },
  addLabel: {
    fontSize: 10,
    color: colors.textFaint,
    marginTop: 4,
  },
});
