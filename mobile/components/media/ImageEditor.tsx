import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "../../lib/theme";

type Props = {
  visible: boolean;
  imageUri: string;
  onSave: (uri: string) => void;
  onClose: () => void;
};

async function cropSquare(uri: string, compress: number) {
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });
  const size = Math.min(width, height);
  return manipulateAsync(
    uri,
    [{ crop: { originX: (width - size) / 2, originY: (height - size) / 2, width: size, height: size } }],
    { compress, format: SaveFormat.JPEG, base64: true }
  );
}

export function ImageEditor({ visible, imageUri, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [uri, setUri] = useState(imageUri);
  const [brightness, setBrightness] = useState(0.85);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUri(imageUri);
    setBrightness(0.85);
  }, [imageUri, visible]);

  async function runEdit(actions: Parameters<typeof manipulateAsync>[1]) {
    setBusy(true);
    try {
      const result = await manipulateAsync(uri, actions, {
        compress: brightness,
        format: SaveFormat.JPEG,
        base64: true,
      });
      setUri(result.base64 ? `data:image/jpeg;base64,${result.base64}` : result.uri);
    } finally {
      setBusy(false);
    }
  }

  async function handleCropSquare() {
    setBusy(true);
    try {
      const result = await cropSquare(uri, brightness);
      setUri(result.base64 ? `data:image/jpeg;base64,${result.base64}` : result.uri);
    } finally {
      setBusy(false);
    }
  }

  async function applyBrightness(level: number) {
    setBrightness(level);
    setBusy(true);
    try {
      const result = await manipulateAsync(uri, [], { compress: level, format: SaveFormat.JPEG, base64: true });
      setUri(result.base64 ? `data:image/jpeg;base64,${result.base64}` : result.uri);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Edit Photo</Text>
          <Pressable onPress={() => onSave(uri)} disabled={busy}>
            <Text style={styles.save}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.previewWrap}>
          {busy ? (
            <ActivityIndicator color={colors.accent} size="large" />
          ) : (
            <Image source={{ uri }} style={styles.preview} resizeMode="contain" />
          )}
        </View>

        <View style={styles.tools}>
          <Pressable style={styles.tool} onPress={() => runEdit([{ rotate: 90 }])} disabled={busy}>
            <Ionicons name="refresh" size={22} color={colors.text} />
            <Text style={styles.toolLabel}>Rotate</Text>
          </Pressable>
          <Pressable style={styles.tool} onPress={handleCropSquare} disabled={busy}>
            <Ionicons name="crop" size={22} color={colors.text} />
            <Text style={styles.toolLabel}>Square</Text>
          </Pressable>
          <Pressable style={styles.tool} onPress={() => applyBrightness(Math.min(1, brightness + 0.1))} disabled={busy}>
            <Ionicons name="sunny" size={22} color={colors.text} />
            <Text style={styles.toolLabel}>Brighten</Text>
          </Pressable>
          <Pressable style={styles.tool} onPress={() => applyBrightness(Math.max(0.4, brightness - 0.1))} disabled={busy}>
            <Ionicons name="moon" size={22} color={colors.text} />
            <Text style={styles.toolLabel}>Darken</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: "600", color: colors.text },
  cancel: { color: colors.textDim, fontSize: 15 },
  save: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  previewWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    margin: spacing.lg,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  preview: { width: "100%", height: "100%" },
  tools: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tool: { alignItems: "center", gap: 6 },
  toolLabel: { fontSize: 11, color: colors.textDim },
});
