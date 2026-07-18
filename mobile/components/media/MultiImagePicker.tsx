import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_URL, getAuthToken } from "../../lib/api";
import { colors, radii, spacing } from "../../lib/theme";
import { PICKER_QUALITY } from "../../lib/image-quality";
import { uploadImage, processImageExtras } from "../../lib/upload";
import { ImageEditor, type EditedImageResult } from "./ImageEditor";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  maxImages?: number;
  label?: string;
  watermarkUsername?: string;
  showCounter?: boolean;
};

export function MultiImagePicker({
  images,
  onChange,
  folder = "uploads",
  maxImages = 20,
  label = "Add",
  watermarkUsername,
  showCounter = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [editUri, setEditUri] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [blurPlates, setBlurPlates] = useState(false);
  const [blurLocked, setBlurLocked] = useState(false);
  const [defaultWatermark, setDefaultWatermark] = useState(false);
  const pendingUris = useRef<string[]>([]);
  const queueTotal = useRef(0);

  useEffect(() => {
    const token = getAuthToken();
    fetch(`${API_URL}/api/settings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.settings) return;
        const alwaysBlur = Boolean(data.settings.alwaysBlurPlates);
        setBlurPlates(alwaysBlur);
        setBlurLocked(alwaysBlur);
        setDefaultWatermark(Boolean(data.settings.alwaysWatermarkExports));
      })
      .catch(() => {});
  }, []);

  async function uploadEdited(result: EditedImageResult) {
    setLoading(true);
    setError("");
    try {
      const processed = await processImageExtras(result.uri, {
        adjustments: result.adjustments,
        blurRegions: result.blurRegions,
        autoBlurPlates: blurPlates,
        watermark: result.addWatermark && watermarkUsername ? `@${watermarkUsername}` : undefined,
      });
      const url = await uploadImage(processed, folder, (percent) => {
        const done = queueTotal.current - pendingUris.current.length;
        setProgress(
          queueTotal.current > 1
            ? `Uploading ${done}/${queueTotal.current} · ${percent}%`
            : `Uploading ${percent}%`
        );
      });
      if (editIndex !== null) {
        const copy = [...images];
        copy[editIndex] = url;
        onChange(copy);
      } else {
        onChange([...images, url].slice(0, maxImages));
      }

      const next = pendingUris.current.shift();
      const done = queueTotal.current - pendingUris.current.length;
      if (next && images.length + (editIndex === null ? 1 : 0) < maxImages) {
        setProgress(queueTotal.current > 1 ? `Photo ${done + 1} of ${queueTotal.current}` : "");
        setEditIndex(null);
        setEditUri(next);
      } else {
        setEditUri(null);
        setEditIndex(null);
        setProgress("");
        queueTotal.current = 0;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setEditUri(null);
      setEditIndex(null);
      pendingUris.current = [];
      queueTotal.current = 0;
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  async function pickPhotos() {
    if (images.length >= maxImages) return;
    setLoading(true);
    setError("");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error("Photo library permission is required.");

      const remaining = maxImages - images.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        allowsEditing: false,
        selectionLimit: remaining,
        quality: PICKER_QUALITY,
      });

      if (result.canceled || result.assets.length === 0) return;

      queueTotal.current = result.assets.length;
      pendingUris.current = result.assets.map((asset) => asset.uri).slice(1);
      setProgress(result.assets.length > 1 ? "Photo 1 of " + result.assets.length : "");
      setEditIndex(null);
      setEditUri(result.assets[0].uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      {showCounter ? (
        <Text style={styles.counter}>
          {images.length} of {maxImages} photos
        </Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.thumbWrap}>
            <Pressable
              onPress={() => {
                pendingUris.current = [];
                queueTotal.current = 0;
                setEditIndex(index);
                setEditUri(uri);
              }}
            >
              <Image source={{ uri }} style={styles.thumb} />
            </Pressable>
            <Pressable style={styles.removeBtn} onPress={() => onChange(images.filter((_, i) => i !== index))}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}

        {images.length < maxImages ? (
          <Pressable style={styles.addTile} onPress={pickPhotos} disabled={loading || Boolean(editUri)}>
            {loading && !editUri ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <>
                <Ionicons name="add" size={28} color={colors.textDim} />
                <Text style={styles.addText}>{label}</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </ScrollView>

      {progress ? <Text style={styles.progress}>{progress}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={() => !blurLocked && setBlurPlates((v) => !v)}
        style={[styles.blurRow, blurLocked && { opacity: 0.6 }]}
        disabled={blurLocked}
      >
        <Text style={styles.blurText}>
          Blur plates {blurPlates ? "✓" : ""}{blurLocked ? " (locked by settings)" : ""}
        </Text>
      </Pressable>

      {editUri ? (
        <ImageEditor
          visible
          imageUri={editUri}
          saving={loading}
          blurPlates={blurPlates}
          watermarkUsername={watermarkUsername}
          defaultWatermark={defaultWatermark}
          onClose={() => {
            if (loading) return;
            setEditUri(null);
            setEditIndex(null);
            pendingUris.current = [];
            queueTotal.current = 0;
            setProgress("");
          }}
          onSave={uploadEdited}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { fontSize: 12, color: colors.textDim, marginBottom: 6 },
  row: { gap: spacing.sm, paddingVertical: 2 },
  thumbWrap: { position: "relative" },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: colors.textDim, fontSize: 10, marginTop: 2, fontWeight: "600" },
  progress: { color: colors.accent, fontSize: 12, marginTop: 6 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
  blurRow: { marginTop: 6 },
  blurText: { fontSize: 12, color: colors.textDim },
});
