import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { pickAndUploadImage } from "../../lib/upload";
import { colors, radii } from "../../lib/theme";

type Props = {
  label?: string;
  folder?: string;
  onUploaded: (url: string) => void;
};

export function ImagePickerField({ label = "Choose photo", folder = "uploads", onUploaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePick() {
    setLoading(true);
    setError("");
    try {
      const url = await pickAndUploadImage(folder);
      if (url) onUploaded(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Pressable style={styles.btn} onPress={handlePick} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.accentText} size="small" />
        ) : (
          <Ionicons name="image-outline" size={18} color={colors.accent} />
        )}
        <Text style={styles.btnText}>{loading ? "Uploading..." : label}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
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
  btnText: { color: colors.textDim, fontSize: 14 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
});
