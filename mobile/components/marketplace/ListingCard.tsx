import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import type { MarketplaceListing } from "../../lib/types";
import { colors, radii, spacing } from "../../lib/theme";
import { formatPrice } from "../../lib/utils";
import { CreateListingForm } from "../forms/CreateForms";
import { Badge } from "../ui/Badge";
import { BookmarkButton } from "../ui/BookmarkButton";
import { OwnerActions } from "../ui/OwnerActions";

type Props = {
  listing: MarketplaceListing;
  onChanged?: () => void;
  initialBookmarked?: boolean;
  onMessage?: (listing: MarketplaceListing) => void;
  onSignInRequired?: () => void;
  onPress?: (listing: MarketplaceListing) => void;
};

export function ListingCard({ listing, onChanged, initialBookmarked, onMessage, onSignInRequired, onPress }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    try {
      await api.deleteListing(listing.id);
      onChanged?.();
    } catch {
      // ignore
    }
  }

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(listing)}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: listing.image }} style={styles.image} />
        <View style={styles.categoryBadge}>
          <Badge variant="accent">{listing.category}</Badge>
        </View>
        {listing.tradeAccepted ? (
          <View style={styles.tradeBadge}>
            <Ionicons name="swap-horizontal" size={12} color={colors.accent} />
            <Text style={styles.tradeText}>Trade OK</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {listing.description}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{listing.location}</Text>
          <Text style={styles.metaText}>{listing.condition.replace("-", " ")}</Text>
        </View>
        <View style={styles.footer}>
          {listing.seller ? (
            <Text style={styles.seller}>Listed by @{listing.seller.username}</Text>
          ) : (
            <View />
          )}
          <View style={styles.footerActions}>
            <BookmarkButton
              targetType="listing"
              targetId={listing.id}
              initialBookmarked={initialBookmarked}
              onSignInRequired={onSignInRequired}
            />
            {onMessage ? (
              <Pressable style={styles.messageBtn} onPress={() => onMessage(listing)}>
                <Ionicons name="chatbubble-outline" size={14} color={colors.accent} />
                <Text style={styles.messageText}>Message</Text>
              </Pressable>
            ) : null}
            <OwnerActions
              ownerId={listing.sellerId}
              entityLabel="listing"
              onEdit={() => setEditOpen(true)}
              onDelete={handleDelete}
              size={18}
            />
          </View>
        </View>
      </View>
      <CreateListingForm
        visible={editOpen}
        editing={listing}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          onChanged?.();
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    overflow: "hidden",
    marginBottom: spacing.md,
    flex: 1,
  },
  imageWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.border,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  tradeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(9,9,11,0.8)",
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tradeText: {
    fontSize: 11,
    color: colors.accent,
  },
  body: {
    padding: spacing.md,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontWeight: "600",
    color: colors.text,
    fontSize: 15,
  },
  price: {
    fontWeight: "700",
    color: colors.accent,
    fontSize: 16,
  },
  description: {
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 18,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 11,
    color: colors.textDim,
    textTransform: "capitalize",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 2,
  },
  footerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  messageBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  messageText: { fontSize: 12, color: colors.accent },
  seller: {
    flex: 1,
    fontSize: 11,
    color: colors.textFaint,
  },
});
