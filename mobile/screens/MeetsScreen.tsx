import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CreateEventForm } from "../components/forms/CreateForms";
import { EventCard } from "../components/events/EventCard";
import { MeetMapMobile } from "../components/events/MeetMapMobile";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { Event, MeetPin } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

const FILTERS = ["All", "Meets", "Cruises", "Shows", "Expos"];

export function MeetsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [pins, setPins] = useState<MeetPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("");
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [eventsData, pinsData] = await Promise.all([api.getEvents(), api.getMeetPins()]);
      setEvents(eventsData);
      setPins(pinsData);
      setError("");
    } catch {
      setError("Could not load events");
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleRsvp = async (eventId: string) => {
    setRsvpLoadingId(eventId);
    try {
      await api.rsvpEvent(eventId);
      await load();
    } catch {
      // ignore
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const filteredEvents = useMemo(() => {
    let result =
      activeFilter === "All"
        ? events
        : events.filter((event) =>
            event.tags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase().slice(0, -1)))
          );
    const city = cityFilter.trim().toLowerCase();
    if (city) {
      result = result.filter(
        (event) => event.city.toLowerCase().includes(city) || event.location.toLowerCase().includes(city)
      );
    }
    return result;
  }, [events, activeFilter, cityFilter]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Meet Board"
        subtitle="Find car meets, cruises, and shows near you"
        onProfilePress={() =>
          user ? navigation.navigate("Profile", { username: user.username }) : navigation.navigate("SignIn")
        }
        rightAction={
          <Pressable
            onPress={() => (user ? setCreateOpen(true) : navigation.navigate("SignIn"))}
            style={styles.createBtn}
          >
            <Ionicons name="add" size={22} color={colors.accentText} />
          </Pressable>
        }
      />
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <>
            <MeetMapMobile events={events} pins={pins} onPinAdded={load} />
            <TextInput
              value={cityFilter}
              onChangeText={setCityFilter}
              placeholder="Filter by city..."
              placeholderTextColor={colors.textFaint}
              style={styles.cityInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {FILTERS.map((filter) => (
                <Text
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                >
                  {filter}
                </Text>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            isAuthenticated={!!user}
            onSignInRequired={() => navigation.navigate("SignIn")}
            onRsvp={handleRsvp}
            rsvpLoading={rsvpLoadingId === item.id}
          />
        )}
      />
      <CreateEventForm visible={createOpen} onClose={() => setCreateOpen(false)} onSuccess={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  cityInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  filters: { gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    fontSize: 13,
    color: colors.textDim,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  filterChipActive: {
    backgroundColor: colors.border,
    color: colors.text,
    fontWeight: "500",
  },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
