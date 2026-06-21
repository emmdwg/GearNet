import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radii, spacing } from "../../lib/theme";
import { pickAndUploadImage, uploadImage } from "../../lib/upload";
import { ImageEditor } from "./ImageEditor";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  maxImages?: number;
  label?: string;
};

export function MultiImagePicker({
  images,
  onChange,
  folder = "uploads",
  maxImages = 10,
  label = "Add photos",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editUri, setEditUri] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  async function pickMore() {
    if (images.length >= maxImages) return;
    setLoading(true);
    setError("");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error("Photo library permission is required.");

      const remaining = maxImages - images.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: remaining > 1,
        selectionLimit: remaining,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;

      const uploaded: string[] = [];
      for (const asset of result.assets) {
        if (!asset.base64) continue;
        const mime = asset.mimeType ?? "image/jpeg";
        const dataUri = `data:${mime};base64,${asset.base64}`;
        const url = await uploadImage(dataUri, folder);
        uploaded.push(url);
      }
      onChange([...images, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function pickSingleWithEdit() {
    setLoading(true);
    setError("");
    try {
      const url = await pickAndUploadImage(folder);
      if (url) onChange([...images, url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    const copy = [...images];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  }

  function openEditor(index: number) {
    setEditIndex(index);
    setEditUri(images[index]);
  }

  async function saveEdit(editedUri: string) {
    if (editIndex === null) return;
    setLoading(true);
    try {
      const url = await uploadImage(editedUri, folder);
      const copy = [...images];
      copy[editIndex] = url;
      onChange(copy);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
      setEditUri(null);
      setEditIndex(null);
    }
  }

  return (
    <View>
      {images.map((uri, index) => (
        <View key={`${uri}-${index}`} style={styles.row}>
          <Image source={{ uri }} style={styles.thumb} />
          <View style={styles.controls}>
            <Pressable onPress={() => move(index, -1)} disabled={index === 0} style={styles.iconBtn}>
              <Ionicons name="chevron-up" size={18} color={index === 0 ? colors.textFaint : colors.textDim} />
            </Pressable>
            <Pressable onPress={() => move(index, 1)} disabled={index === images.length - 1} style={styles.iconBtn}>
              <Ionicons name="chevron-down" size={18} color={index === images.length - 1 ? colors.textFaint : colors.textDim} />
            </Pressable>
            <Pressable onPress={() => openEditor(index)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={18} color={colors.accent} />
            </Pressable>
            <Pressable onPress={() => removeAt(index)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      ))}

      {images.length < maxImages ? (
        <Pressable style={styles.addBtn} onPress={maxImages === 1 ? pickSingleWithEdit : pickMore} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Ionicons name="images-outline" size={18} color={colors.accent} />
          )}
          <Text style={styles.addText}>{loading ? "Uploading..." : label}</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {editUri ? (
        <ImageEditor
          visible
          imageUri={editUri}
          onClose={() => {
            setEditUri(null);
            setEditIndex(null);
          }}
          onSave={saveEdit}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
  },
  controls: { flex: 1, flexDirection: "row", gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: "dashed",
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addText: { color: colors.textDim, fontSize: 14 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
});
