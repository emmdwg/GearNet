import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreateEventForm } from "../forms/CreateForms";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { PlaceAutocompleteInput } from "../ui/PlaceAutocompleteInput";
import type { PlaceSuggestion } from "../ui/PlaceAutocompleteInput";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { filterByRadius } from "../../lib/geo";
import { colors, radii, spacing } from "../../lib/theme";
import type { ConvoyShare, Event, EventParkingZone, MeetPin } from "../../lib/types";

type Props = {
  events: Event[];
  pins: MeetPin[];
  onPinAdded: () => void;
  selectedEventId?: string | null;
};

type GeocodeResult = { lat: string; lon: string; display_name: string };

const LOCAL_DELTA = 0.015;
const PREVIEW_DELTA = 0.06;

function regionFor(lat: number, lng: number, delta = LOCAL_DELTA): Region {
  return { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
}

export function MeetMapMobile({ events, pins, onPinAdded, selectedEventId }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const pinTitleRef = useRef<TextInput>(null);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [pinTitle, setPinTitle] = useState("");
  const [pinAddress, setPinAddress] = useState("");
  const [pinDescription, setPinDescription] = useState("");
  const [pinType, setPinType] = useState<"meet" | "dyno">("meet");
  const [dynoHp, setDynoHp] = useState("");
  const [showShops, setShowShops] = useState(true);
  const [verifiedShops, setVerifiedShops] = useState<
    { id: string; displayName: string; latitude: number; longitude: number; location: string }[]
  >([]);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showAllMarkers, setShowAllMarkers] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MeetPin | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventPrefill, setEventPrefill] = useState<{
    title?: string;
    location?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }>();
  const [convoyShares, setConvoyShares] = useState<ConvoyShare[]>([]);
  const [parkingZones, setParkingZones] = useState<EventParkingZone[]>([]);
  const [region, setRegion] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: 25,
    longitudeDelta: 25,
  });

  const eventMarkers = useMemo(
    () => events.filter((e) => e.latitude != null && e.longitude != null),
    [events],
  );

  const visibleEvents = useMemo(() => {
    if (showAllMarkers || !userLocation) return eventMarkers;
    return filterByRadius(
      eventMarkers.map((e) => ({ ...e, latitude: e.latitude!, longitude: e.longitude! })),
      userLocation.lat,
      userLocation.lng,
    );
  }, [eventMarkers, showAllMarkers, userLocation]);

  useEffect(() => {
    api.getVerifiedShopsMap().then(setVerifiedShops).catch(() => setVerifiedShops([]));
  }, []);

  const activePins = useMemo(
    () =>
      pins.filter((p) => {
        if (!p.expiresAt) return true;
        return new Date(p.expiresAt).getTime() > Date.now();
      }),
    [pins],
  );

  const visiblePins = useMemo(() => {
    if (showAllMarkers || !userLocation) return activePins;
    return filterByRadius(activePins, userLocation.lat, userLocation.lng);
  }, [activePins, showAllMarkers, userLocation]);

  const centerOnUser = useCallback(async (dropPin = false) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow location to see meets near you on the map");
      return false;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;
    const next = regionFor(lat, lng, PREVIEW_DELTA);
    setUserLocation({ lat, lng });
    setRegion(next);
    mapRef.current?.animateToRegion(next, 450);
    if (dropPin) setPending({ lat, lng });
    return true;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await centerOnUser(false);
      } catch {
        if (active) Alert.alert("Location", "Could not find your location");
      } finally {
        if (active) setLocating(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [centerOnUser]);

  useEffect(() => {
    if (!selectedEventId) {
      setConvoyShares([]);
      setParkingZones([]);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const [convoy, zones] = await Promise.all([
          api.getEventConvoy(selectedEventId),
          api.getEventParkingZones(selectedEventId),
        ]);
        if (active) {
          setConvoyShares(convoy);
          setParkingZones(zones);
        }
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 15_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [selectedEventId]);

  async function geocode(query: string) {
    try {
      const list = await api.autocompletePlaces(query, userLocation ?? undefined);
      if (list[0]) {
        return {
          lat: list[0].lat,
          lng: list[0].lng,
          address: list[0].subtitle ? `${list[0].label}, ${list[0].subtitle}` : list[0].label,
        };
      }
    } catch {
      // fallback below
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } },
    );
    const data = (await res.json()) as GeocodeResult[];
    if (!data[0]) throw new Error("Location not found");
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      address: data[0].display_name,
    };
  }

  function clearPending() {
    setPending(null);
    setPinTitle("");
    setPinAddress("");
    setPinDescription("");
    setPinType("meet");
    setDynoHp("");
  }

  function applyPlaceSelection(lat: number, lng: number, address: string, titleHint: string) {
    const next = regionFor(lat, lng);
    setRegion(next);
    mapRef.current?.animateToRegion(next, 450);
    setPending({ lat, lng });
    setPinAddress(address);
    setPinTitle(titleHint);
    setPinDescription("");
    setTimeout(() => pinTitleRef.current?.focus(), 200);
  }

  function goToPlace(place: PlaceSuggestion) {
    const address = place.subtitle ? `${place.label}, ${place.subtitle}` : place.label;
    applyPlaceSelection(place.lat, place.lng, address, place.label);
  }

  async function handleSearch() {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const result = await geocode(search);
      applyPlaceSelection(
        result.lat,
        result.lng,
        result.address,
        result.address.split(",")[0]?.trim() || search.trim(),
      );
    } catch {
      Alert.alert("Not found", "Could not find that location â€” try a more specific address");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecenter() {
    setLoading(true);
    try {
      await centerOnUser(false);
    } catch {
      Alert.alert("GPS error", "Could not get your location");
    } finally {
      setLoading(false);
    }
  }

  async function savePin() {
    if (!pending) return;
    if (!user) {
      Alert.alert("Sign in required", "Sign in to drop meet pins on the map");
      return;
    }
    if (!pinTitle.trim()) return;
    setLoading(true);
    try {
      await api.createMeetPin({
        title: pinTitle.trim(),
        description: pinDescription.trim() || undefined,
        latitude: pending.lat,
        longitude: pending.lng,
        address: pinAddress.trim() || search.trim(),
        pinType,
        dynoHp: pinType === "dyno" && dynoHp ? parseFloat(dynoHp) : undefined,
      });
      clearPending();
      setSearch("");
      onPinAdded();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save pin");
    } finally {
      setLoading(false);
    }
  }

  const cruiseRoutes = useMemo(
    () =>
      events
        .filter((e) => (e.routeJson?.length ?? 0) > 1)
        .map((e) => ({ id: e.id, points: e.routeJson! })),
    [events],
  );

  const visibleRoutes = useMemo(() => {
    if (showAllMarkers || !userLocation) return cruiseRoutes;
    const visibleIds = new Set(visibleEvents.map((e) => e.id));
    return cruiseRoutes.filter((r) => visibleIds.has(r.id));
  }, [cruiseRoutes, visibleEvents, showAllMarkers, userLocation]);

  const mapContent = (interactive: boolean, mapStyle: object) => (
    <MapView
      ref={interactive ? mapRef : undefined}
      style={mapStyle}
      region={region}
      onRegionChangeComplete={interactive ? setRegion : undefined}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={interactive}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {visibleRoutes.map((route) => (
        <Polyline
          key={route.id}
          coordinates={route.points.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
          strokeColor="#f59e0b"
          strokeWidth={4}
        />
      ))}
      {visibleEvents.map((event) => (
        <Marker
          key={event.id}
          coordinate={{ latitude: event.latitude!, longitude: event.longitude! }}
          title={event.title}
          description={event.city}
          pinColor="#fafafa"
        />
      ))}
      {visiblePins.map((pin) => (
        <Marker
          key={pin.id}
          coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
          title={pin.title}
          description={pin.pinType === "dyno" && pin.dynoHp ? `${pin.dynoHp} HP` : pin.address}
          pinColor={pin.pinType === "dyno" ? "#ef4444" : selectedPin?.id === pin.id ? "#ef4444" : "#f59e0b"}
          onPress={interactive ? () => {
            setSelectedPin(pin);
            setPending(null);
          } : undefined}
        />
      ))}
      {showShops
        ? verifiedShops.map((shop) => (
            <Marker
              key={`shop-${shop.id}`}
              coordinate={{ latitude: shop.latitude, longitude: shop.longitude }}
              title={shop.displayName}
              description="Verified shop"
              pinColor="#22c55e"
            />
          ))
        : null}
      {selectedEventId
        ? convoyShares.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.latitude, longitude: s.longitude }}
              title={s.user?.displayName ?? "Convoy"}
              description="Live convoy"
              pinColor="#f59e0b"
            />
          ))
        : null}
      {selectedEventId
        ? parkingZones.map((z) => (
            <Marker
              key={z.id}
              coordinate={{ latitude: z.latitude, longitude: z.longitude }}
              title={z.label}
              description="Parking zone"
              pinColor="#a78bfa"
            />
          ))
        : null}
      {pending && interactive ? (
        <Marker coordinate={{ latitude: pending.lat, longitude: pending.lng }} pinColor="#ef4444" />
      ) : null}
    </MapView>
  );

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.title}>Meet Map</Text>
        <Text style={styles.subtitle}>
          {locating ? "Finding your locationâ€¦" : "Search an address to drop a community meet pin"}
        </Text>

        <Pressable style={styles.previewTap} onPress={() => setExpanded(true)}>
          <View pointerEvents="none">{mapContent(false, styles.mapPreview)}</View>
          <View style={styles.previewOverlay}>
            <View style={styles.previewCta}>
              <Ionicons name="expand-outline" size={16} color={colors.text} />
              <Text style={styles.previewCtaText}>Open map Â· search & drop pin</Text>
            </View>
          </View>
        </Pressable>
      </View>

      <Modal visible={expanded} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setExpanded(false)}>
        <View style={styles.fullScreen}>
          <View style={styles.mapFull}>{mapContent(true, StyleSheet.absoluteFill)}</View>

          <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]} pointerEvents="box-none">
            <View style={styles.searchRow}>
              <Pressable style={styles.closeFab} onPress={() => setExpanded(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#27272a" />
              </Pressable>
              <View style={styles.searchFlex}>
                <PlaceAutocompleteInput
                  variant="map"
                  autoFocus
                  value={search}
                  onChangeText={setSearch}
                  onSelect={goToPlace}
                  userLocation={userLocation}
                  placeholder="Search address to drop a pin"
                  onSubmitEditing={handleSearch}
                />
              </View>
              {userLocation ? (
                <Pressable style={styles.showAllBtn} onPress={() => setShowAllMarkers((v) => !v)}>
                  <Text style={styles.showAllText}>{showAllMarkers ? "Near me" : "Show all"}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.showAllBtn} onPress={() => setShowShops((v) => !v)}>
                <Text style={styles.showAllText}>{showShops ? "Hide shops" : "Shops"}</Text>
              </Pressable>
            </View>

            <View style={{ flex: 1 }} pointerEvents="none" />

            <View style={styles.fabRow}>
              <Pressable style={styles.gpsFab} onPress={handleRecenter} disabled={loading}>
                <Ionicons name="locate" size={22} color="#3f3f46" />
              </Pressable>
            </View>

            {selectedPin ? (
              <View style={styles.bottomSheet}>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetPinIcon}>
                    <Ionicons name="location" size={20} color="#f59e0b" />
                  </View>
                  <View style={styles.sheetHeaderText}>
                    <Text style={styles.sheetTitle} numberOfLines={2}>
                      {selectedPin.title}
                    </Text>
                    {selectedPin.address ? (
                      <Text style={styles.sheetSubtitle} numberOfLines={2}>
                        {selectedPin.address}
                      </Text>
                    ) : null}
                    {selectedPin.pinType === "dyno" && selectedPin.dynoHp ? (
                      <Text style={styles.dynoBadge}>{selectedPin.dynoHp} HP dyno pin</Text>
                    ) : null}
                  </View>
                  <Pressable onPress={() => setSelectedPin(null)} hitSlop={8}>
                    <Ionicons name="close" size={18} color={colors.textDim} />
                  </Pressable>
                </View>
                <View style={styles.pinActions}>
                  <Pressable
                    style={styles.pinActionBtn}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedPin.latitude},${selectedPin.longitude}`,
                      )
                    }
                  >
                    <Text style={styles.pinActionText}>Navigate</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.pinActionBtn, styles.pinActionPrimary]}
                    onPress={() => {
                      setEventPrefill({
                        title: selectedPin.title,
                        location: selectedPin.address || selectedPin.title,
                        city: selectedPin.address?.split(",")[0]?.trim() ?? "",
                        latitude: selectedPin.latitude,
                        longitude: selectedPin.longitude,
                      });
                      setCreateEventOpen(true);
                    }}
                  >
                    <Text style={styles.pinActionPrimaryText}>Create event</Text>
                  </Pressable>
                  {user?.id === selectedPin.userId ? (
                    <Pressable
                      style={styles.pinActionBtn}
                      onPress={() => {
                        Alert.alert("Delete pin?", selectedPin.title, [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => {
                              void api.deleteMeetPin(selectedPin.id).then(() => {
                                setSelectedPin(null);
                                onPinAdded();
                              });
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={styles.pinActionDanger}>Delete</Text>
                    </Pressable>
                  ) : null}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinList}>
                  {visiblePins.map((pin) => (
                    <Pressable
                      key={pin.id}
                      style={[styles.pinListItem, selectedPin.id === pin.id && styles.pinListItemActive]}
                      onPress={() => setSelectedPin(pin)}
                    >
                      <Text style={styles.pinListTitle} numberOfLines={1}>
                        {pin.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : pending ? (
              <View style={styles.bottomSheet}>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetPinIcon}>
                    <Ionicons name="location" size={20} color="#f87171" />
                  </View>
                  <View style={styles.sheetHeaderText}>
                    <Text style={styles.sheetTitle}>Pin details</Text>
                    <Text style={styles.sheetSubtitle}>Edit the name, address, or notes before dropping</Text>
                  </View>
                  <Pressable onPress={clearPending} hitSlop={8}>
                    <Ionicons name="close" size={18} color={colors.textDim} />
                  </Pressable>
                </View>
                <Text style={styles.sheetFieldLabel}>Pin type</Text>
                <View style={styles.pinTypeRow}>
                  {(["meet", "dyno"] as const).map((type) => (
                    <Pressable
                      key={type}
                      style={[styles.pinTypeBtn, pinType === type && styles.pinTypeBtnActive]}
                      onPress={() => setPinType(type)}
                    >
                      <Text style={[styles.pinTypeText, pinType === type && styles.pinTypeTextActive]}>
                        {type === "dyno" ? "Dyno" : "Meet"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.sheetFieldLabel}>Pin name</Text>
                <TextInput
                  ref={pinTitleRef}
                  value={pinTitle}
                  onChangeText={setPinTitle}
                  onSubmitEditing={savePin}
                  placeholder="e.g. Friday Night Meet"
                  placeholderTextColor={colors.textFaint}
                  style={styles.sheetInput}
                  returnKeyType="next"
                />
                <Text style={styles.sheetFieldLabel}>Address</Text>
                <TextInput
                  value={pinAddress}
                  onChangeText={setPinAddress}
                  placeholder="Street, city, state"
                  placeholderTextColor={colors.textFaint}
                  style={styles.sheetInput}
                />
                <Text style={styles.sheetFieldLabel}>Notes (optional)</Text>
                <TextInput
                  value={pinDescription}
                  onChangeText={setPinDescription}
                  placeholder="Parking lot behind the shopâ€¦"
                  placeholderTextColor={colors.textFaint}
                  style={[styles.sheetInput, styles.sheetTextArea]}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
                {pinType === "dyno" ? (
                  <>
                    <Text style={styles.sheetFieldLabel}>HP reading (optional)</Text>
                    <TextInput
                      value={dynoHp}
                      onChangeText={setDynoHp}
                      placeholder="e.g. 420"
                      placeholderTextColor={colors.textFaint}
                      keyboardType="decimal-pad"
                      style={styles.sheetInput}
                    />
                  </>
                ) : null}
                <Pressable
                  style={[styles.sheetSaveBtn, (loading || !pinTitle.trim()) && styles.sheetSaveBtnDisabled]}
                  onPress={savePin}
                  disabled={loading || !pinTitle.trim()}
                >
                  <Ionicons name="location" size={16} color={colors.accentText} />
                  <Text style={styles.sheetSaveText}>
                    {loading ? "Dropping pinâ€¦" : "Drop pin at this address"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.idleSheet}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinList}>
                  {visiblePins.map((pin) => (
                    <Pressable key={pin.id} style={styles.pinListItem} onPress={() => setSelectedPin(pin)}>
                      <Text style={styles.pinListTitle} numberOfLines={1}>
                        {pin.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Ionicons name="search" size={22} color={colors.textDim} />
                <Text style={styles.idleTitle}>Search for an address above</Text>
                <Text style={styles.idleSubtitle}>Pick a result to place your meet pin on the map</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <CreateEventForm
        visible={createEventOpen}
        onClose={() => {
          setCreateEventOpen(false);
          setEventPrefill(undefined);
        }}
        onSuccess={onPinAdded}
        prefill={eventPrefill}
      />
    </>
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
  previewTap: { position: "relative" },
  mapPreview: { height: 180, width: "100%" },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 14,
    backgroundColor: "rgba(9,9,11,0.25)",
  },
  previewCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(24,24,27,0.95)",
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  previewCtaText: { fontSize: 13, fontWeight: "600", color: colors.text },
  fullScreen: { flex: 1, backgroundColor: "#09090b" },
  mapFull: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  searchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  closeFab: {
    marginTop: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  searchFlex: { flex: 1, minWidth: 0 },
  showAllBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "rgba(24,24,27,0.95)",
  },
  showAllText: { fontSize: 11, fontWeight: "600", color: colors.text },
  pinActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pinActionBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pinActionPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  pinActionText: { fontSize: 13, color: colors.text, fontWeight: "600" },
  pinActionPrimaryText: { fontSize: 13, color: colors.accentText, fontWeight: "600" },
  pinActionDanger: { fontSize: 13, color: "#f87171", fontWeight: "600" },
  pinList: { gap: 8, paddingBottom: 8 },
  pinListItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.card,
    maxWidth: 160,
  },
  pinListItemActive: { borderColor: colors.accent, backgroundColor: "rgba(245, 158, 11,0.12)" },
  pinListTitle: { fontSize: 12, color: colors.text, fontWeight: "500" },
  fabRow: { alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 8 },
  gpsFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  bottomSheet: {
    backgroundColor: "rgba(9,9,11,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: 12,
  },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sheetPinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeaderText: { flex: 1, minWidth: 0 },
  sheetTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  sheetSubtitle: { fontSize: 12, color: colors.textDim, marginTop: 2 },
  dynoBadge: { fontSize: 11, color: "#f87171", fontWeight: "600", marginTop: 4 },
  pinTypeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  pinTypeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  pinTypeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pinTypeText: { fontSize: 12, fontWeight: "600", color: colors.textDim },
  pinTypeTextActive: { color: colors.accentText },
  sheetFieldLabel: { fontSize: 12, fontWeight: "500", color: colors.textDim, marginBottom: 6 },
  sheetInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.card,
    fontSize: 14,
    marginBottom: 12,
  },
  sheetTextArea: { minHeight: 64, paddingTop: 12 },
  sheetSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  sheetSaveBtnDisabled: { opacity: 0.5 },
  sheetSaveText: { color: colors.accentText, fontWeight: "600", fontSize: 14 },
  idleSheet: {
    alignItems: "center",
    backgroundColor: "rgba(9,9,11,0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 6,
  },
  idleTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 4 },
  idleSubtitle: { fontSize: 12, color: colors.textDim, textAlign: "center" },
});
