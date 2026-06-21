import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { CreateVehicleForm } from "../components/forms/CreateForms";
import { ManageGarageModal } from "../components/garage/ManageGarageModal";
import { BuildLogCard, ModRow, VehicleCard } from "../components/garage/VehicleCard";
import { AuthPrompt } from "../components/ui/AuthPrompt";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { Vehicle } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

export function GarageScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getVehicles();
      setVehicles(data);
      setError("");
    } catch {
      setError("Could not load your garage");
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

  const openProfile = () => {
    if (user) navigation.navigate("Profile", { username: user.username });
    else navigation.navigate("SignIn");
  };

  if (authLoading || (user && loading)) return <LoadingState />;
  if (!user) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Digital Garage" subtitle="Your vehicles, mods & build logs" onProfilePress={() => navigation.navigate("SignIn")} />
        <AuthPrompt
          title="Sign in to view your garage"
          description="Manage your vehicles, track modifications, and share build logs with the community."
          onSignIn={() => navigation.navigate("SignIn")}
          onSignUp={() => navigation.navigate("SignUp")}
        />
      </View>
    );
  }

  if (error) return <ErrorState message={error} />;

  const allBuildLogs = vehicles.flatMap((v) => v.buildLogs);
  const totalMods = vehicles.reduce((sum, v) => sum + v.mods.length, 0);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={`${user.displayName}'s Garage`}
        subtitle={`${vehicles.length} vehicles · ${totalMods} total mods`}
        onProfilePress={openProfile}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.hero}>
          {vehicles[0]?.image ? (
            <Image source={{ uri: vehicles[0].image }} style={styles.heroImg} blurRadius={1} />
          ) : null}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.kicker}>DIGITAL GARAGE</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{vehicles.length}</Text>
                <Text style={styles.heroStatLabel}>Vehicles</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{totalMods}</Text>
                <Text style={styles.heroStatLabel}>Mods</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{allBuildLogs.length}</Text>
                <Text style={styles.heroStatLabel}>Build Logs</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.outlineBtn} onPress={() => navigation.navigate("Saved")}>
            <Ionicons name="bookmark-outline" size={16} color={colors.textDim} />
            <Text style={styles.outlineBtnText}>Saved</Text>
          </Pressable>
          <Pressable style={styles.outlineBtn} onPress={() => setManageOpen(true)}>
            <Ionicons name="settings-outline" size={16} color={colors.textDim} />
            <Text style={styles.outlineBtnText}>Manage</Text>
          </Pressable>
          <Pressable style={styles.amberBtn} onPress={() => setAddOpen(true)}>
            <Ionicons name="add" size={16} color={colors.accentText} />
            <Text style={styles.amberBtnText}>Add Vehicle</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>My Vehicles</Text>
        {vehicles.length === 0 ? (
          <Text style={styles.empty}>No vehicles yet. Add your first ride to get started.</Text>
        ) : (
          vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onChanged={load} />)
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

        <Pressable onPress={openProfile} style={styles.profileLink}>
          <Text style={styles.profileLinkText}>View public profile →</Text>
        </Pressable>
      </ScrollView>
      <CreateVehicleForm visible={addOpen} onClose={() => setAddOpen(false)} onSuccess={load} />
      {user ? (
        <ManageGarageModal
          visible={manageOpen}
          onClose={() => setManageOpen(false)}
          vehicles={vehicles}
          username={user.username}
          onViewProfile={() => navigation.navigate("Profile", { username: user.username })}
          onViewPublicGarage={() => navigation.navigate("UserGarage", { username: user.username })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  hero: {
    height: 132,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.card,
    marginBottom: spacing.md,
    justifyContent: "flex-end",
  },
  heroImg: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(9,9,11,0.45)" },
  heroContent: { padding: spacing.md },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.accent,
    marginBottom: 10,
  },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1 },
  heroStatNum: { fontSize: 20, fontWeight: "700", color: colors.text },
  heroStatLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  heroDivider: { width: 1, height: 28, backgroundColor: colors.borderLight, marginHorizontal: spacing.sm },
  actions: { flexDirection: "row", gap: 8, marginBottom: spacing.lg },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outlineBtnText: { color: colors.textDim, fontSize: 13 },
  amberBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  amberBtnText: { color: colors.accentText, fontWeight: "600", fontSize: 13 },
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
