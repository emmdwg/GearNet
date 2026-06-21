import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { pickAvatarImage, uploadImage } from "../../lib/upload";
import { colors } from "../../lib/theme";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  size?: number;
  uploadOnPick?: boolean;
};

export function AvatarPicker({
  value,
  onChange,
  label = "Tap to add photo",
  size = 96,
  uploadOnPick = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pick() {
    setLoading(true);
    setError("");
    try {
      const dataUrl = await pickAvatarImage();
      if (!dataUrl) {
        setLoading(false);
        return;
      }
      if (!uploadOnPick) {
        onChange(dataUrl);
        setLoading(false);
        return;
      }
      const url = await uploadImage(dataUrl, "avatars");
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update photo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={pick} disabled={loading} style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={{ uri: value || DEFAULT_AVATAR }} style={styles.image} />
        <View style={styles.overlay}>
          <Ionicons name="camera" size={22} color="#fff" />
        </View>
      </Pressable>
      <Text style={styles.label}>{loading ? "Uploading..." : label}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8 },
  ring: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.borderLight,
    backgroundColor: colors.card,
  },
  image: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, color: colors.textDim },
  error: { fontSize: 12, color: colors.danger },
});
