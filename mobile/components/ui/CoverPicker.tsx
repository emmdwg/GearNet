import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { pickCoverImage, uploadImage } from "../../lib/upload";
import { colors, radii } from "../../lib/theme";

type Props = {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  uploadOnPick?: boolean;
};

export function CoverPicker({ value, onChange, height = 120, uploadOnPick = true }: Props) {
  const [loading, setLoading] = useState(false);

  async function pick() {
    setLoading(true);
    try {
      const dataUrl = await pickCoverImage();
      if (!dataUrl) return;
      if (!uploadOnPick) {
        onChange(dataUrl);
        return;
      }
      const url = await uploadImage(dataUrl, "covers");
      onChange(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable onPress={pick} style={[styles.wrap, { height }]}>
      {value ? <Image source={{ uri: value }} style={styles.image} /> : <View style={styles.placeholder} />}
      <View style={styles.overlay}>
        <Ionicons name="camera" size={20} color="#fff" />
        <Text style={styles.text}>{loading ? "Uploading..." : "Change cover"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardMuted,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  text: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
