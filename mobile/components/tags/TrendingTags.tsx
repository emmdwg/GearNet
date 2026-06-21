import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { colors, radii, spacing } from "../../lib/theme";
import type { RootStackParamList } from "../../navigation/types";

type TrendingTag = { tag: string; count: number };

export function TrendingTags({ compact = false }: { compact?: boolean }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tags, setTags] = useState<TrendingTag[]>([]);

  useEffect(() => {
    api.getTrendingTags().then((r) => setTags(r.tags)).catch(() => setTags([]));
  }, []);

  if (tags.length === 0) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.title}>Trending Tags</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tags.map(({ tag, count }) => (
          <Pressable
            key={tag}
            style={styles.chip}
            onPress={() => navigation.navigate("Tag", { tag })}
          >
            <Text style={styles.chipText}>#{tag}</Text>
            <Text style={styles.count}>{count}</Text>
          </Pressable>
        ))}
      </ScrollView>
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
    marginBottom: spacing.md,
  },
  wrapCompact: { marginBottom: spacing.sm },
  title: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textDim,
    marginBottom: 10,
  },
  row: { gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, color: colors.textMuted },
  count: { fontSize: 11, color: colors.textFaint },
});
