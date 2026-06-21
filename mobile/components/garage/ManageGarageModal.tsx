import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Vehicle } from "../../lib/types";
import { colors, radii, spacing } from "../../lib/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  username: string;
  onViewProfile: () => void;
  onViewPublicGarage: () => void;
};

export function ManageGarageModal({
  visible,
  onClose,
  vehicles,
  username,
  onViewProfile,
  onViewPublicGarage,
}: Props) {
  const totalMods = vehicles.reduce((a, v) => a + v.mods.length, 0);
  const totalLogs = vehicles.reduce((a, v) => a + v.buildLogs.length, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Manage Garage</Text>
          <Text style={styles.summary}>
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} · {totalMods} mods · {totalLogs} build logs
          </Text>
          <ScrollView style={styles.list}>
            {vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicleRow}>
                <Text style={styles.vehicleName}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.vehicleMeta}>
                  {vehicle.mods.length} mods · {vehicle.buildLogs.length} build logs · {vehicle.color}
                </Text>
              </View>
            ))}
          </ScrollView>
          <Pressable
            style={styles.outlineBtn}
            onPress={() => {
              onClose();
              onViewProfile();
            }}
          >
            <Text style={styles.outlineText}>View public profile</Text>
          </Pressable>
          <Pressable
            style={styles.amberBtn}
            onPress={() => {
              onClose();
              onViewPublicGarage();
            }}
          >
            <Text style={styles.amberText}>View public garage</Text>
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    maxHeight: "80%",
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 },
  summary: { fontSize: 13, color: colors.textDim, marginBottom: spacing.md },
  list: { maxHeight: 240, marginBottom: spacing.md },
  vehicleRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: 8,
    backgroundColor: colors.cardMuted,
  },
  vehicleName: { fontSize: 14, fontWeight: "600", color: colors.text },
  vehicleMeta: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  outlineText: { color: colors.textMuted, fontSize: 14 },
  amberBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  amberText: { color: colors.accentText, fontWeight: "600", fontSize: 14 },
  closeBtn: { alignItems: "center", paddingVertical: 8 },
  closeText: { color: colors.textDim, fontSize: 13 },
});
