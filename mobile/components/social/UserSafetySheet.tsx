import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../../lib/api";
import { colors, radii, spacing } from "../../lib/theme";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

type Props = {
  userId: string;
  username: string;
  visible: boolean;
  onClose: () => void;
  onBlocked?: () => void;
};

export function UserSafetySheet({ userId, username, visible, onClose, onBlocked }: Props) {
  const [blocked, setBlocked] = useState(false);
  const [mode, setMode] = useState<"menu" | "report">("menu");
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!visible) return;
    api
      .getBlockStatus(userId)
      .then((d) => setBlocked(d.blocked))
      .catch(() => {});
    setMode("menu");
    setMessage("");
  }, [visible, userId]);

  async function toggleBlock() {
    if (blocked) await api.unblockUser(userId);
    else {
      await api.blockUser(userId);
      onBlocked?.();
    }
    setBlocked(!blocked);
    setMessage(blocked ? "User unblocked" : "User blocked");
    onClose();
  }

  async function submitReport() {
    await api.reportUser({ userId, reason, details });
    setMessage("Report submitted");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {mode === "menu" ? (
            <>
              <Text style={styles.title}>@{username}</Text>
              <Pressable style={styles.btn} onPress={() => setMode("report")}>
                <Ionicons name="flag-outline" size={18} color={colors.textMuted} />
                <Text style={styles.btnText}>Report user</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={toggleBlock}>
                <Ionicons name="ban-outline" size={18} color={colors.danger} />
                <Text style={[styles.btnText, { color: colors.danger }]}>{blocked ? "Unblock" : "Block"}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Report @{username}</Text>
              {REASONS.map((r) => (
                <Pressable key={r.value} style={styles.chip} onPress={() => setReason(r.value)}>
                  <Text style={[styles.chipText, reason === r.value && styles.chipActive]}>{r.label}</Text>
                </Pressable>
              ))}
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Optional details"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                multiline
              />
              <View style={styles.row}>
                <Pressable style={[styles.action, styles.cancel]} onPress={() => setMode("menu")}>
                  <Text style={styles.cancelText}>Back</Text>
                </Pressable>
                <Pressable style={[styles.action, styles.submit]} onPress={submitReport}>
                  <Text style={styles.submitText}>Submit</Text>
                </Pressable>
              </View>
            </>
          )}
          {message ? <Text style={styles.msg}>{message}</Text> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    padding: spacing.lg,
    gap: 10,
  },
  title: { color: colors.text, fontWeight: "700", fontSize: 16, marginBottom: 4 },
  btn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  btnText: { color: colors.textMuted, fontSize: 15 },
  chip: { alignSelf: "flex-start" },
  chipText: {
    color: colors.textDim,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  chipActive: { borderColor: colors.accent, color: colors.accent },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    padding: 10,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 8 },
  action: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: radii.sm },
  cancel: { borderWidth: 1, borderColor: colors.borderLight },
  cancelText: { color: colors.textMuted },
  submit: { backgroundColor: colors.accent },
  submitText: { color: colors.accentText, fontWeight: "600" },
  msg: { color: colors.success, fontSize: 13, textAlign: "center" },
});
