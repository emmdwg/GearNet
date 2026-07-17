import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../../lib/api";
import { colors, radii, spacing } from "../../lib/theme";
import { FormModal } from "../forms/FormModal";

type Collection = {
  id: string;
  name: string;
  postIds: string[];
  count: number;
};

type Props = {
  postId: string;
  visible: boolean;
  onClose: () => void;
};

export function SaveToCollectionModal({ postId, visible, onClose }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!visible) return;
    setMessage("");
    api
      .getCollections()
      .then(setCollections)
      .catch(() => setCollections([]));
  }, [visible]);

  async function addToCollection(collectionId: string) {
    setLoading(true);
    try {
      await api.addToCollection(collectionId, postId);
      setMessage("Saved!");
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, postIds: [...c.postIds, postId], count: c.count + 1 } : c
        )
      );
    } catch {
      setMessage("Couldn’t save to collection.");
    } finally {
      setLoading(false);
    }
  }

  async function createAndSave() {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const created = await api.createCollection(name);
      setNewName("");
      setCollections((prev) => [created, ...prev]);
      await addToCollection(created.id);
    } catch {
      setMessage("Couldn’t create collection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} onClose={onClose} title="Save to collection">
      {collections.length === 0 ? (
        <Text style={styles.empty}>No collections yet. Create one below.</Text>
      ) : (
        <View style={styles.list}>
          {collections.map((c) => {
            const saved = c.postIds.includes(postId);
            return (
              <Pressable
                key={c.id}
                disabled={loading || saved}
                onPress={() => void addToCollection(c.id)}
                style={[styles.row, (loading || saved) && styles.rowDisabled]}
              >
                <Text style={styles.rowName}>{c.name}</Text>
                <Text style={styles.rowMeta}>{saved ? "Saved" : `${c.count} posts`}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={styles.createRow}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="New collection name"
          placeholderTextColor={colors.textDim}
          style={styles.input}
        />
        <Pressable
          disabled={loading || !newName.trim()}
          onPress={() => void createAndSave()}
          style={[styles.createBtn, (loading || !newName.trim()) && styles.createBtnDisabled]}
        >
          <Text style={styles.createBtnText}>Create</Text>
        </Pressable>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </FormModal>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, color: colors.textDim },
  list: { gap: 6, maxHeight: 200 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowDisabled: { opacity: 0.5 },
  rowName: { fontSize: 14, color: colors.text, flex: 1 },
  rowMeta: { fontSize: 12, color: colors.textDim },
  createRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  createBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { color: colors.accentText, fontWeight: "600", fontSize: 14 },
  message: { fontSize: 14, color: colors.accent, marginTop: 4 },
});
