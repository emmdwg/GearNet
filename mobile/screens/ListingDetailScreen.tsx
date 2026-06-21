import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookmarkButton } from "../components/ui/BookmarkButton";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { OwnerActions } from "../components/ui/OwnerActions";
import { CreateListingForm } from "../components/forms/CreateForms";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, radii, spacing } from "../lib/theme";
import type { MarketplaceListing, User } from "../lib/types";
import { formatPrice } from "../lib/utils";
import type { RootStackParamList } from "../navigation/types";

type ListingDetail = MarketplaceListing & { bookmarked?: boolean; seller: User };

export function ListingDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ListingDetail">>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { listingId } = route.params;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api.getListing(listingId);
      setListing(data);
      setError("");
    } catch {
      setError("Could not load listing");
    }
  }, [listingId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleMessage() {
    if (!user) {
      navigation.navigate("SignIn");
      return;
    }
    if (!listing) return;
    try {
      const conv = await api.createConversation(listing.seller.id);
      navigation.navigate("ChatThread", {
        conversationId: conv.id,
        otherUser: {
          id: listing.seller.id,
          username: listing.seller.username,
          displayName: listing.seller.displayName,
          avatar: listing.seller.avatar,
        },
      });
    } catch {
      navigation.navigate("MainTabs", { screen: "Chat" });
    }
  }

  async function handleDelete() {
    try {
      await api.deleteListing(listingId);
      navigation.goBack();
    } catch {
      // ignore
    }
  }

  if (loading) return <LoadingState />;
  if (error || !listing) return <ErrorState message={error || "Listing not found"} />;

  const images = listing.images && listing.images.length > 0 ? listing.images : [listing.image];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Listing
        </Text>
        <OwnerActions
          ownerId={listing.sellerId}
          entityLabel="listing"
          onEdit={() => setEditOpen(true)}
          onDelete={handleDelete}
        />
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={16}
      >
        {images.map((uri, i) => (
          <Image key={`${uri}-${i}`} source={{ uri }} style={{ width, height: width * 0.75 }} />
        ))}
      </ScrollView>
      {images.length > 1 ? (
        <Text style={styles.counter}>
          {page + 1}/{images.length}
        </Text>
      ) : null}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        </View>
        <View style={styles.badges}>
          <Badge variant="accent">{listing.category}</Badge>
          {listing.tradeAccepted ? <Badge variant="outline">Trade OK</Badge> : null}
        </View>
        <Text style={styles.description}>{listing.description}</Text>
        <Text style={styles.meta}>
          {listing.location} · {listing.condition.replace("-", " ")}
        </Text>

        <Pressable
          style={styles.sellerRow}
          onPress={() => navigation.navigate("Profile", { username: listing.seller.username })}
        >
          <Avatar src={listing.seller.avatar} alt={listing.seller.displayName} />
          <View>
            <Text style={styles.sellerName}>{listing.seller.displayName}</Text>
            <Text style={styles.sellerHandle}>@{listing.seller.username}</Text>
          </View>
        </Pressable>

        <View style={styles.actions}>
          <Pressable style={styles.messageBtn} onPress={handleMessage}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.accentText} />
            <Text style={styles.messageText}>Message Seller</Text>
          </Pressable>
          <BookmarkButton
            targetType="listing"
            targetId={listing.id}
            initialBookmarked={listing.bookmarked}
            onSignInRequired={() => navigation.navigate("SignIn")}
          />
        </View>
      </View>

      <CreateListingForm
        visible={editOpen}
        editing={listing}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          load();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  counter: { textAlign: "center", fontSize: 12, color: colors.textDim, marginTop: 6 },
  body: { padding: spacing.lg, gap: 12 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  title: { flex: 1, fontSize: 22, fontWeight: "700", color: colors.text },
  price: { fontSize: 20, fontWeight: "700", color: colors.accent },
  badges: { flexDirection: "row", gap: 8 },
  description: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  meta: { fontSize: 12, color: colors.textDim, textTransform: "capitalize" },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    backgroundColor: colors.cardMuted,
  },
  sellerName: { fontSize: 15, fontWeight: "600", color: colors.text },
  sellerHandle: { fontSize: 12, color: colors.textDim },
  actions: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 12,
  },
  messageText: { fontSize: 14, fontWeight: "600", color: colors.accentText },
});
