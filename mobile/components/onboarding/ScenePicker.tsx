import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import { SCENE_TAGS } from "../../lib/scene-tags";
import { colors, radii, spacing } from "../../lib/theme";

export function ScenePicker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getSettings(), api.getTagFollows().catch(() => [])])
      .then(([settingsData, follows]) => {
        const tags = settingsData.settings.sceneTags ?? [];
        if (tags.length > 0) setSaved(true);
        setFollowed(new Set(follows.filter((f) => f.tagType === "scene").map((f) => f.tag)));
      })
      .catch(() => null);
  }, []);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function toggleFollow(id: string) {
    const res = await api.toggleTagFollow(id, "scene");
    setFollowed((prev) => {
      const next = new Set(prev);
      if (res.following) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function save() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await api.updateSettings({ settings: { sceneTags: selected } });
      for (const id of selected) {
        if (!followed.has(id)) await api.toggleTagFollow(id, "scene");
      }
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  if (saved) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Your scenes</Text>
        <View style={styles.tags}>
          {SCENE_TAGS.map((tag) => {
            const following = followed.has(tag.id);
            return (
              <Pressable key={tag.id} onPress={() => toggleFollow(tag.id)} style={[styles.chip, following && styles.chipActive]}>
                <Text style={[styles.chipText, following && styles.chipTextActive]}>
                  {following ? "✓ " : ""}{tag.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pick your scene</Text>
      <Text style={styles.subtitle}>We&apos;ll tailor your feed and you can follow scenes for updates</Text>
      <View style={styles.tags}>
        {SCENE_TAGS.map((tag) => {
          const active = selected.includes(tag.id);
          return (
            <Pressable key={tag.id} onPress={() => toggle(tag.id)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={[styles.saveBtn, (loading || selected.length === 0) && styles.saveBtnDisabled]} onPress={save} disabled={loading || selected.length === 0}>
        <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save & follow scenes"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  title: { color: colors.text, fontWeight: "700", fontSize: 15 },
  subtitle: { color: colors.textDim, fontSize: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: colors.accentText },
  saveBtn: {
    marginTop: 4,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.accentText, fontWeight: "700", fontSize: 14 },
});
