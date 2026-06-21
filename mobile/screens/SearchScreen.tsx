import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { MarketplaceListing, Post, User, Vehicle } from "../lib/types";
import { Avatar } from "../components/ui/Avatar";
import { TrendingTags } from "../components/tags/TrendingTags";
import type { RootStackParamList } from "../navigation/types";

type SearchVehicle = Vehicle & { owner?: { username: string; displayName: string } };
type Results = { users: User[]; posts: Post[]; vehicles: SearchVehicle[]; listings: MarketplaceListing[] };
const EMPTY: Results = { users: [], posts: [], vehicles: [], listings: [] };
const TABS = ["All", "People", "Vehicles", "Posts", "Market"] as const;
type Tab = (typeof TABS)[number];

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Search">>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState(route.params?.query ?? "");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("All");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gridSize = (width - spacing.lg * 2 - 4) / 3;

  const runSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.search(q.trim());
        setResults(data);
      } catch {
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  useEffect(() => {
    runSearch(query);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const total = results.users.length + results.vehicles.length + results.posts.length + results.listings.length;
  const showPeople = tab === "All" || tab === "People";
  const showVehicles = tab === "All" || tab === "Vehicles";
  const showPosts = tab === "All" || tab === "Posts";
  const showMarket = tab === "All" || tab === "Market";

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.searchRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={16} color={colors.textDim} style={styles.inputIcon} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search people, vehicles, builds..."
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!query.trim() ? (
          <View style={{ paddingTop: 8 }}>
            <TrendingTags compact />
            <Text style={[styles.hint, { marginTop: 24 }]}>Search GearNet for builders, vehicles, posts, and listings.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : total === 0 ? (
          <Text style={styles.hint}>No results for “{query.trim()}”.</Text>
        ) : (
          <>
            {showPeople && results.users.length > 0 ? (
              <Section title="People">
                {results.users.map((u) => (
                  <Pressable
                    key={u.id}
                    style={styles.userRow}
                    onPress={() => navigation.navigate("Profile", { username: u.username })}
                  >
                    <Avatar src={u.avatar} alt={u.displayName} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.displayName}</Text>
                      <Text style={styles.userHandle}>@{u.username}</Text>
                    </View>
                  </Pressable>
                ))}
              </Section>
            ) : null}

            {showVehicles && results.vehicles.length > 0 ? (
              <Section title="Vehicles">
                {results.vehicles.map((v) => (
                  <Pressable
                    key={v.id}
                    style={styles.vehicleRow}
                    onPress={() =>
                      v.owner
                        ? navigation.navigate("UserGarage", { username: v.owner.username })
                        : undefined
                    }
                  >
                    <Image source={{ uri: v.image }} style={styles.vehicleImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>
                        {v.year} {v.make} {v.model}
                      </Text>
                      {v.owner ? <Text style={styles.userHandle}>@{v.owner.username}</Text> : null}
                    </View>
                  </Pressable>
                ))}
              </Section>
            ) : null}

            {showPosts && results.posts.length > 0 ? (
              <Section title="Posts">
                <View style={styles.grid}>
                  {results.posts.map((p) => (
                    <Pressable
                      key={p.id}
                      style={{ width: gridSize, height: gridSize }}
                      onPress={() => navigation.navigate("PostViewer", { postId: p.id, post: p })}
                    >
                      <Image source={{ uri: p.image }} style={styles.gridImg} />
                    </Pressable>
                  ))}
                </View>
              </Section>
            ) : null}

            {showMarket && results.listings.length > 0 ? (
              <Section title="Marketplace">
                {results.listings.map((l) => (
                  <Pressable
                    key={l.id}
                    style={styles.userRow}
                    onPress={() => navigation.navigate("ListingDetail", { listingId: l.id })}
                  >
                    <Image source={{ uri: l.image }} style={styles.listingImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {l.title}
                      </Text>
                      <Text style={styles.userHandle}>
                        {l.location} · {l.category}
                      </Text>
                    </View>
                    <Text style={styles.price}>${l.price.toLocaleString()}</Text>
                  </Pressable>
                ))}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: spacing.lg },
  back: { padding: 2 },
  inputWrap: { flex: 1, position: "relative", justifyContent: "center" },
  inputIcon: { position: "absolute", left: 12, zIndex: 1 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingLeft: 36,
    paddingRight: 14,
    color: colors.text,
    fontSize: 14,
  },
  tabsScroll: { flexGrow: 0, marginTop: spacing.md },
  tabs: { paddingHorizontal: spacing.lg, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textDim },
  tabTextActive: { color: colors.accentText },
  content: { padding: spacing.lg },
  hint: { textAlign: "center", color: colors.textDim, fontSize: 14, marginTop: 48 },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textDim,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 8,
  },
  userName: { fontSize: 15, fontWeight: "600", color: colors.text },
  userHandle: { fontSize: 12, color: colors.textDim, marginTop: 2 },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    borderRadius: radii.md,
    padding: 8,
    marginBottom: 8,
  },
  vehicleImg: { width: 72, height: 48, borderRadius: 8, backgroundColor: colors.border },
  listingImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.border },
  price: { fontSize: 14, fontWeight: "700", color: colors.accent },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  gridImg: { width: "100%", height: "100%", borderRadius: 4, backgroundColor: colors.border },
});
