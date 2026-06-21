import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { RootStackParamList } from "../navigation/types";

type Status = {
  hasAvatar: boolean;
  hasVehicle: boolean;
  followCount: number;
  completed: boolean;
  dismissed: boolean;
};

export function OnboardingBanner() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    api
      .getOnboarding()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status || status.completed || status.dismissed) return null;

  const steps = [
    { done: status.hasAvatar, label: "Profile photo", action: () => navigation.navigate("Settings") },
    { done: status.hasVehicle, label: "First car", action: () => navigation.navigate("MainTabs", { screen: "Garage" }) },
    { done: status.followCount >= 3, label: `Follow 3 (${Math.min(status.followCount, 3)}/3)`, action: () => {} },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Get started</Text>
        <Pressable onPress={() => api.dismissOnboarding().then(() => setStatus({ ...status, dismissed: true }))}>
          <Ionicons name="close" size={18} color={colors.textDim} />
        </Pressable>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${(done / 3) * 100}%` }]} />
      </View>
      {steps.map((step) => (
        <Pressable key={step.label} style={styles.row} onPress={step.action}>
          <Ionicons
            name={step.done ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={step.done ? colors.success : colors.textDim}
          />
          <Text style={[styles.rowText, step.done && styles.doneText]}>{step.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    backgroundColor: "rgba(245,158,11,0.08)",
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontWeight: "700", fontSize: 15 },
  bar: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.accent },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  rowText: { color: colors.textMuted, fontSize: 14 },
  doneText: { color: colors.textDim, textDecorationLine: "line-through" },
});
