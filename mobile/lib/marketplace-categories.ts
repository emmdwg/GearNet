export const MARKETPLACE_CATEGORIES = [
  { id: "vehicle", label: "Whole Vehicles", shortLabel: "Vehicles" },
  { id: "engine", label: "Engine & Powertrain", shortLabel: "Engine" },
  { id: "transmission", label: "Transmission & Drivetrain", shortLabel: "Transmission" },
  { id: "suspension", label: "Suspension & Steering", shortLabel: "Suspension" },
  { id: "brakes", label: "Brakes", shortLabel: "Brakes" },
  { id: "wheels", label: "Wheels & Tires", shortLabel: "Wheels" },
  { id: "exterior", label: "Exterior & Body", shortLabel: "Exterior" },
  { id: "interior", label: "Interior", shortLabel: "Interior" },
  { id: "electronics", label: "Electronics & Infotainment", shortLabel: "Electronics" },
  { id: "lighting", label: "Lighting", shortLabel: "Lighting" },
  { id: "exhaust", label: "Exhaust & Intake", shortLabel: "Exhaust" },
  { id: "cooling", label: "Cooling & HVAC", shortLabel: "Cooling" },
  { id: "fuel", label: "Fuel System", shortLabel: "Fuel" },
  { id: "performance", label: "Performance & Tuning", shortLabel: "Performance" },
  { id: "tools", label: "Tools & Shop", shortLabel: "Tools" },
  { id: "fluids", label: "Fluids & Maintenance", shortLabel: "Fluids" },
  { id: "safety", label: "Safety & Racing Gear", shortLabel: "Safety" },
  { id: "memorabilia", label: "Memorabilia & Collectibles", shortLabel: "Memorabilia" },
  { id: "accessories", label: "Accessories & Merch", shortLabel: "Accessories" },
  { id: "parts", label: "General Parts", shortLabel: "Parts" },
] as const;

export type MarketplaceCategoryId = (typeof MARKETPLACE_CATEGORIES)[number]["id"];

export const MARKETPLACE_CONDITIONS = ["new", "like-new", "good", "fair", "project"] as const;

export type MarketplaceCondition = (typeof MARKETPLACE_CONDITIONS)[number];

export const MARKETPLACE_FILTER_OPTIONS = [
  { id: "all", label: "All" },
  ...MARKETPLACE_CATEGORIES.map((c) => ({ id: c.id, label: c.shortLabel })),
  { id: "trade", label: "Trade" },
  { id: "price_drops", label: "Price drops" },
  { id: "sold", label: "Sold" },
] as const;

export type MarketplaceListingFilterFields = {
  category: string;
  tradeAccepted?: boolean;
  soldAt?: string | null;
  originalPrice?: number | null;
  price: number;
};

const categoryById = new Map(MARKETPLACE_CATEGORIES.map((c) => [c.id, c]));
const allowedIds = new Set<string>(MARKETPLACE_CATEGORIES.map((c) => c.id));

export function getCategoryLabel(id: string): string {
  return categoryById.get(id as MarketplaceCategoryId)?.label ?? formatUnknownCategory(id);
}

export function getCategoryShortLabel(id: string): string {
  return categoryById.get(id as MarketplaceCategoryId)?.shortLabel ?? formatUnknownCategory(id);
}

function formatUnknownCategory(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeMarketplaceCategory(id: unknown): MarketplaceCategoryId {
  if (typeof id === "string" && allowedIds.has(id)) {
    return id as MarketplaceCategoryId;
  }
  if (id === "trade") return "accessories";
  return "parts";
}

export function listingMatchesCategoryFilter(
  listing: MarketplaceListingFilterFields | string,
  filterId: string,
  tradeAccepted = false,
): boolean {
  const l: MarketplaceListingFilterFields =
    typeof listing === "string"
      ? { category: listing, tradeAccepted, price: 0 }
      : listing;

  if (filterId === "all") return !l.soldAt;
  if (filterId === "sold") return Boolean(l.soldAt);
  if (filterId === "price_drops") {
    return !l.soldAt && l.originalPrice != null && l.originalPrice > l.price;
  }
  if (filterId === "trade") return Boolean(l.tradeAccepted) && !l.soldAt;
  return l.category === filterId && !l.soldAt;
}
