import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, type MapPressEvent } from "react-native-maps";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { colors, radii, spacing } from "../../lib/theme";
import type { Event, MeetPin } from "../../lib/types";

type Props = {
  events: Event[];
  pins: MeetPin[];
  onPinAdded: () => void;
};

type GeocodeResult = { lat: string; lon: string; display_name: string };

export function MeetMapMobile({ events, pins, onPinAdded }: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [pinTitle, setPinTitle] = useState("");
  const [pending, setPending] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: 25,
    longitudeDelta: 25,
  });

  const eventMarkers = useMemo(
    () => events.filter((e) => e.latitude != null && e.longitude != null),
    [events]
  );

  async function geocode(query: string) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = (await res.json()) as GeocodeResult[];
    if (!data[0]) throw new Error("Location not found");
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      address: data[0].display_name,
    };
  }

  async function handleSearch() {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const result = await geocode(search);
      setRegion({
        latitude: result.lat,
        longitude: result.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });
      setPending({ lat: result.lat, lng: result.lng, address: result.address });
    } catch {
      Alert.alert("Not found", "Could not find that location");
    } finally {
      setLoading(false);
    }
  }

  async function handleGps() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow location to drop a pin at your GPS position");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setPending({ lat, lng });
    } catch {
      Alert.alert("GPS error", "Could not get your location");
    } finally {
      setLoading(false);
    }
  }

  function handleMapPress(e: MapPressEvent) {
    if (!user) {
      Alert.alert("Sign in required", "Sign in to drop meet pins on the map");
      return;
    }
    setPending({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude });
  }

  async function savePin() {
    if (!pending || !pinTitle.trim()) return;
    setLoading(true);
    try {
      await api.createMeetPin({
        title: pinTitle.trim(),
        latitude: pending.lat,
        longitude: pending.lng,
        address: pending.address ?? search,
      });
      setPinTitle("");
      setPending(null);
      setSearch("");
      onPinAdded();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save pin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Meet Map</Text>
      <Text style={styles.subtitle}>Drop pins with GPS, search a spot, or tap the map</Text>

      <View style={styles.toolbar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search address or place..."
          placeholderTextColor={colors.textFaint}
          style={styles.search}
          onSubmitEditing={handleSearch}
        />
        <Pressable style={styles.toolBtn} onPress={handleGps}>
          <Ionicons name="locate-outline" size={18} color={colors.accent} />
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={handleSearch}>
          <Ionicons name="search" size={18} color={colors.text} />
        </Pressable>
      </View>

      <MapView style={styles.map} region={region} onRegionChangeComplete={setRegion} onPress={handleMapPress}>
        {eventMarkers.map((event) => (
          <Marker
            key={event.id}
            coordinate={{ latitude: event.latitude!, longitude: event.longitude! }}
            title={event.title}
            description={event.city}
            pinColor="#fafafa"
          />
        ))}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.title}
            description={pin.address}
            pinColor="#f59e0b"
          />
        ))}
        {pending ? (
          <Marker coordinate={{ latitude: pending.lat, longitude: pending.lng }} pinColor="#ef4444" />
        ) : null}
      </MapView>

      {pending ? (
        <View style={styles.pinForm}>
          <TextInput
            value={pinTitle}
            onChangeText={setPinTitle}
            placeholder="Pin name (e.g. Friday Night Meet)"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
          <View style={styles.pinActions}>
            <Pressable style={styles.saveBtn} onPress={savePin} disabled={loading || !pinTitle.trim()}>
              <Text style={styles.saveText}>{loading ? "Saving..." : "Drop Pin"}</Text>
            </Pressable>
            <Pressable onPress={() => setPending(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.cardMuted,
  },
  title: { fontSize: 16, fontWeight: "600", color: colors.text, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  subtitle: { fontSize: 12, color: colors.textDim, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  toolbar: { flexDirection: "row", gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.card,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  map: { height: 220, width: "100%" },
  pinForm: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.card,
  },
  pinActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: colors.accentText, fontWeight: "600" },
  cancelText: { color: colors.textDim },
});
