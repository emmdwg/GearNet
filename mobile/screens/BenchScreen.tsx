import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { BenchHeaderCards } from "../components/bench/BenchHeaderCards";
import { FluidSpecPanel } from "../components/bench/FluidSpecPanel";
import { OdometerChart } from "../components/bench/OdometerChart";
import { CreateMaintenanceForm } from "../components/forms/CreateForms";
import { MaintenanceEntry } from "../components/bench/MaintenanceEntry";
import { MaintenanceRemindersPanel } from "../components/bench/MaintenanceRemindersPanel";
import { ManualLibrary } from "../components/bench/ManualLibrary";
import { RecallsPanel } from "../components/bench/RecallsPanel";
import { ShopsPanel } from "../components/bench/ShopsPanel";
import { AuthPrompt } from "../components/ui/AuthPrompt";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { BenchSummary, MaintenanceLog, ServiceManual, ServiceSuggestion, Vehicle } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function BenchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [manuals, setManuals] = useState<ServiceManual[]>([]);
  const [manualTotal, setManualTotal] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [summary, setSummary] = useState<BenchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [logOpen, setLogOpen] = useState(false);
  const [shopFilter, setShopFilter] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<ServiceSuggestion | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [vehicleResult, logResult, manualResult, summaryResult] = await Promise.allSettled([
      api.getVehicles(),
      api.getMaintenanceLogs(),
      api.getServiceManuals(),
      api.getBenchSummary(),
    ]);

    if (vehicleResult.status === "fulfilled") setVehicles(vehicleResult.value);
    else setVehicles([]);

    if (logResult.status === "fulfilled") setLogs(logResult.value);
    else setLogs([]);

    if (manualResult.status === "fulfilled") {
      setManuals(Array.isArray(manualResult.value.results) ? manualResult.value.results : []);
      setManualTotal(manualResult.value.total ?? manualResult.value.vehicleTotal ?? 0);
      setVehicleCount(manualResult.value.vehicleCount ?? 0);
    }

    if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
    else setSummary(null);

    const allFailed =
      vehicleResult.status === "rejected" &&
      logResult.status === "rejected" &&
      manualResult.status === "rejected";
    setError(allFailed ? "Could not load service bench" : "");
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

  const primaryVehicle = vehicles[0];

  const filteredLogs = useMemo(
    () => (shopFilter ? logs.filter((l) => l.shopName === shopFilter) : logs),
    [logs, shopFilter],
  );

  function applySuggestion(s: ServiceSuggestion) {
    setSuggestion(s);
    setLogOpen(true);
  }

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
        <BenchHeaderCards summary={summary} />
        <OdometerChart logs={logs} vehicleId={primaryVehicle?.id} />
        <FluidSpecPanel vehicles={vehicles} onSaved={load} />

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

        <ShopsPanel logs={logs} activeShop={shopFilter} onFilterShop={setShopFilter} />

        <MaintenanceRemindersPanel
          logs={logs}
          vehicleId={primaryVehicle?.id}
          onApplySuggestion={applySuggestion}
        />

        {primaryVehicle ? (
          <RecallsPanel vehicleId={primaryVehicle.id} vehicle={primaryVehicle} />
        ) : null}

        <Text style={styles.sectionTitle}>Maintenance Log</Text>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => <MaintenanceEntry key={log.id} log={log} />)
        ) : (
          <Text style={styles.empty}>
            {shopFilter ? `No records for ${shopFilter}.` : "No service records yet."}
          </Text>
        )}

        <ManualLibrary
          initialManuals={manuals}
          totalCount={manualTotal}
          vehicleCount={vehicleCount}
          fleetVehicles={vehicles}
        />
      </ScrollView>
      <CreateMaintenanceForm
        visible={logOpen}
        onClose={() => {
          setLogOpen(false);
          setSuggestion(null);
        }}
        onSuccess={load}
        vehicles={vehicles}
        suggestion={suggestion ?? undefined}
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
