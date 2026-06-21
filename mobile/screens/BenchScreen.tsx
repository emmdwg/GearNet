import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { CreateMaintenanceForm } from "../components/forms/CreateForms";
import { MaintenanceEntry, ManualCard } from "../components/bench/MaintenanceEntry";
import { AuthPrompt } from "../components/ui/AuthPrompt";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { MaintenanceLog, ServiceManual, Vehicle } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function BenchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [manuals, setManuals] = useState<ServiceManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [logOpen, setLogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [vehicleData, logData, manualData] = await Promise.all([
        api.getVehicles(),
        api.getMaintenanceLogs(),
        api.getServiceManuals(),
      ]);
      setVehicles(vehicleData);
      setLogs(logData);
      setManuals(manualData);
      setError("");
    } catch {
      setError("Could not load service bench");
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
  }, [user, authLoading, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (authLoading || (user && loading)) return <LoadingState />;

  if (!user) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          title="Service Bench"
          subtitle="Maintenance logs and repair references for your fleet"
          onProfilePress={() => navigation.navigate("SignIn")}
        />
        <AuthPrompt
          title="Sign in to use Service Bench"
          description="Track maintenance, log service records, and browse repair references for your vehicles."
          onSignIn={() => navigation.navigate("SignIn")}
          onSignUp={() => navigation.navigate("SignUp")}
        />
      </View>
    );
  }

  if (error) return <ErrorState message={error} />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Service Bench"
        subtitle="Maintenance logs and repair references for your fleet"
        onProfilePress={() => navigation.navigate("Profile", { username: user.username })}
        rightAction={
          <Pressable onPress={() => setLogOpen(true)} style={styles.createBtn}>
            <Ionicons name="add" size={22} color={colors.accentText} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.fleetGrid}>
          {vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.fleetCard}>
              <Text style={styles.fleetTitle}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.fleetMeta}>
                {logs.filter((l) => l.vehicleId === vehicle.id).length} service records
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Maintenance Log</Text>
        {logs.length > 0 ? (
          logs.map((log) => <MaintenanceEntry key={log.id} log={log} />)
        ) : (
          <Text style={styles.empty}>No service records yet.</Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Reference Manuals</Text>
        <Text style={styles.sectionHint}>Community-sourced repair guides tailored to popular platforms</Text>
        {manuals.map((manual) => (
          <ManualCard key={manual.id} manual={manual} />
        ))}
      </ScrollView>
      <CreateMaintenanceForm
        visible={logOpen}
        onClose={() => setLogOpen(false)}
        onSuccess={load}
        vehicles={vehicles}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  fleetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  fleetCard: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    padding: spacing.md,
  },
  fleetTitle: { fontWeight: "600", color: colors.text, fontSize: 14 },
  fleetMeta: { fontSize: 11, color: colors.textDim, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 },
  sectionHint: { fontSize: 13, color: colors.textDim, marginBottom: 12 },
  empty: { fontSize: 14, color: colors.textDim, marginBottom: 16 },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
