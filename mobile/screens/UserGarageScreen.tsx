import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuildLogCard, ModRow, VehicleCard } from "../components/garage/VehicleCard";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { User, Vehicle } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";
import { Ionicons } from "@expo/vector-icons";

export function UserGarageScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "UserGarage">>();
  const insets = useSafeAreaInsets();
  const { username } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getUser(username);
      setUser(data.user);
      setVehicles(data.vehicles);
      setError("");
    } catch {
      setError("Could not load garage");
    }
  }, [username]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (loading) return <LoadingState />;
  if (error || !user) return <ErrorState message={error || "Garage not found"} />;

  const allBuildLogs = vehicles.flatMap((v) => v.buildLogs);
  const totalMods = vehicles.reduce((a, v) => a + v.mods.length, 0);
  const coverImage = vehicles[0]?.image ?? null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load().finally(() => setRefreshing(false));
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.hero}>
        {coverImage ? <Image source={{ uri: coverImage }} style={styles.heroImg} blurRadius={1} /> : null}
        <View style={styles.heroOverlay} />
        <Pressable onPress={() => navigation.goBack()} style={[styles.back, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.heroContent}>
          <Text style={styles.kicker}>DIGITAL GARAGE</Text>
          <Text style={styles.title}>{user.displayName}&apos;s Garage</Text>
          {user.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.location}>{user.location}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{totalMods}</Text>
            <Text style={styles.statLabel}>Mods</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{allBuildLogs.length}</Text>
            <Text style={styles.statLabel}>Build Logs</Text>
          </View>
        </View>

        {vehicles.length === 0 ? (
          <Text style={styles.empty}>No vehicles in this garage yet.</Text>
        ) : (
          vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)
        )}

        {vehicles.some((v) => v.mods.length > 0) ? (
          <>
            <Text style={styles.sectionTitle}>Modifications</Text>
            <View style={styles.table}>
              {vehicles.flatMap((vehicle) =>
                vehicle.mods.map((mod) => (
                  <ModRow
                    key={mod.id}
                    mod={mod}
                    vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  />
                ))
              )}
            </View>
          </>
        ) : null}

        {allBuildLogs.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Build Logs</Text>
            {allBuildLogs.map((log) => (
              <BuildLogCard key={log.id} log={log} />
            ))}
          </>
        ) : null}

        <Pressable onPress={() => navigation.navigate("Profile", { username })} style={styles.profileLink}>
          <Text style={styles.profileLinkText}>View public profile →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 180, backgroundColor: colors.card, justifyContent: "flex-end" },
  heroImg: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(9,9,11,0.45)" },
  back: {
    position: "absolute",
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(9,9,11,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: { padding: spacing.lg },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: colors.accent },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  location: { fontSize: 13, color: colors.textMuted },
  body: { padding: spacing.lg, marginTop: -20 },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.borderLight },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12, marginTop: 8 },
  empty: { fontSize: 14, color: colors.textDim, marginBottom: 16 },
  table: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  profileLink: { alignItems: "center", marginTop: 16 },
  profileLinkText: { color: colors.accent, fontSize: 14 },
});
