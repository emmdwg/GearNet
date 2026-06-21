import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CreateListingForm } from "../components/forms/CreateForms";
import { ListingCard } from "../components/marketplace/ListingCard";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { SearchInput } from "../components/ui/SearchInput";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import type { MarketplaceListing } from "../lib/types";
import type { RootStackParamList } from "../navigation/types";

const CATEGORIES = ["All", "Vehicles", "Parts", "Wheels", "Accessories", "Trade"];

export function ExchangeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setListings(await api.getListings());
      if (user) {
        try {
          const bookmarks = await api.getBookmarks();
          setBookmarkedIds(new Set(bookmarks.listingIds));
        } catch {
          // non-fatal
        }
      } else {
        setBookmarkedIds(new Set());
      }
      setError("");
    } catch {
      setError("Could not load listings");
    }
  }, [user]);

  async function handleMessage(listing: MarketplaceListing) {
    if (!user) {
      navigation.navigate("SignIn");
      return;
    }
    if (listing.sellerId === user.id) return;
    try {
      const conv = await api.createConversation(listing.sellerId);
      navigation.navigate("ChatThread", {
        conversationId: conv.id,
        otherUser: {
          id: listing.sellerId,
          username: listing.seller?.username ?? "",
          displayName: listing.seller?.username ?? "Seller",
          avatar: "",
        },
      });
    } catch {
      navigation.navigate("MainTabs", { screen: "Chat" });
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredListings = useMemo(() => {
    let result = listings;
    if (activeCategory !== "All") {
      if (activeCategory === "Trade") {
        result = result.filter((l) => l.tradeAccepted);
      } else {
        result = result.filter((l) => l.category.toLowerCase() === activeCategory.toLowerCase().replace(/s$/, ""));
      }
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }
    if (maxPrice.trim()) {
      const max = parseInt(maxPrice, 10);
      if (!Number.isNaN(max)) result = result.filter((l) => l.price <= max);
    }
    return result;
  }, [listings, activeCategory, search, maxPrice]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Parts Exchange"
        subtitle="Buy, sell, and trade vehicles & car parts"
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
        data={filteredListings}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <>
            <SearchInput value={search} onChangeText={setSearch} placeholder="Search listings..." />
            <TextInput
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Max price ($)"
              placeholderTextColor={colors.textFaint}
              keyboardType="numeric"
              style={styles.maxPriceInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
              {CATEGORIES.map((cat) => (
                <Text
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                >
                  {cat}
                </Text>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            initialBookmarked={bookmarkedIds.has(item.id)}
            onChanged={load}
            onPress={(listing) => navigation.navigate("ListingDetail", { listingId: listing.id })}
            onMessage={item.sellerId !== user?.id ? handleMessage : undefined}
            onSignInRequired={() => navigation.navigate("SignIn")}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No listings found.</Text>}
      />
      <CreateListingForm visible={createOpen} onClose={() => setCreateOpen(false)} onSuccess={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  maxPriceInput: {
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
  categories: { gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    fontSize: 12,
    color: colors.textDim,
    backgroundColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.accent,
    color: colors.accentText,
    fontWeight: "600",
  },
  empty: { textAlign: "center", color: colors.textDim, marginTop: 24 },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
