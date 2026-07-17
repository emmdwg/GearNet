import type { MarketplaceCategoryId } from "@/lib/marketplace-categories";

export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  location: string;
  interests: string[];
  primaryVehicleId?: string | null;
  buildStreak?: number;
  lastBuildActivityAt?: string | null;
  maintenanceStreak?: number;
  lastMaintenanceAt?: string | null;
  verifiedSeller?: boolean;
  isVerifiedShop?: boolean;
  isPro?: boolean;
  proExpiresAt?: string | null;
  garageSlug?: string | null;
  sceneTags?: string[];
  referralCount?: number;
  joinedAt: string;
};

export type Vehicle = {
  id: string;
  userId: string;
  slug?: string | null;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color: string;
  image: string;
  vin?: string;
  story?: string;
  projectStatus?: string;
  buildProgress?: number;
  installHours?: number;
  waitingOnParts?: boolean;
  waitingOnPartsNote?: string;
  forSale?: boolean;
  mods: Modification[];
  buildLogs: BuildLog[];
  fluidNotes?: string;
  beforeAfterPosts?: Array<{
    id: string;
    beforeImage: string;
    afterImage: string;
    caption: string;
  }>;
};

export type Modification = {
  id: string;
  name: string;
  category: string;
  status?: "installed" | "planned" | "removed";
  installedAt: string;
  estimatedCost?: number;
  notes?: string;
  videoUrl?: string;
  affiliateUrl?: string;
  partType?: "oem" | "aftermarket" | "custom";
  marketplaceAlert?: boolean;
};

export type BuildLog = {
  id: string;
  vehicleId: string;
  title: string;
  content: string;
  milestoneType?: string;
  image?: string;
  images?: string[];
  dynoHp?: number;
  dynoTorque?: number;
  lapTime?: string;
  trackName?: string;
  createdAt: string;
};

export type PostType = "standard" | "build" | "before-after" | "collab" | "audio";

export type VideoChapter = {
  timeSec: number;
  label: string;
};

export type Post = {
  id: string;
  userId: string;
  image: string;
  images?: string[];
  mediaType?: "image" | "video";
  videoUrl?: string;
  videoDuration?: number;
  videoPoster?: string;
  videoChapters?: VideoChapter[];
  vehicleId?: string | null;
  postType?: PostType;
  beforeImage?: string | null;
  afterImage?: string | null;
  inspiredByPostId?: string | null;
  collaborators?: string[];
  /** Optional resolved profiles for collaborator usernames (avatars for Build crew stack). */
  collaboratorUsers?: Array<{ username: string; displayName?: string; avatar?: string }>;
  audioUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  clubId?: string | null;
  vehicleRef?: string;
  dynoHighlight?: string;
  forSale?: boolean;
  status?: "draft" | "published" | "scheduled";
  scheduledAt?: string | null;
  isSponsored?: boolean;
  sponsorName?: string | null;
  sponsorUrl?: string | null;
  reactionCounts?: Partial<Record<"like" | "fire" | "wrench" | "want" | "clean", number>>;
  userReaction?: "like" | "fire" | "wrench" | "want" | "clean" | null;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export type CreatorLink = {
  id: string;
  title: string;
  url: string;
  sortOrder: number;
};

export type PitUpdateSlide = { image: string; caption?: string };

export type PitUpdate = {
  id: string;
  userId: string;
  image: string;
  slides?: PitUpdateSlide[];
  caption: string;
  visibility?: "public" | "followers" | "crew" | "private";
  expiresAt: string;
  likes?: number;
  comments?: number;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export type RouteStop = { name: string; lat: number; lng: number };

export type RsvpStatus = "going" | "maybe" | "spectator" | "showing-car";

export type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  date: string;
  time: string;
  organizerId: string;
  clubId?: string | null;
  club?: { id: string; slug: string; name: string; image?: string | null; isPublic?: boolean } | null;
  attendeeCount: number;
  maxAttendees?: number | null;
  tags: string[];
  image: string;
  latitude?: number;
  longitude?: number;
  recurringRule?: string | null;
  routeJson?: RouteStop[];
  isOutdoor?: boolean;
  boostedUntil?: string | null;
  featured?: boolean;
  ticketPrice?: number | null;
  ticketUrl?: string | null;
  /** Present when events are fetched for an authenticated viewer. */
  viewerRsvpStatus?: RsvpStatus | null;
};

export type EventCheckIn = {
  id: string;
  eventId: string;
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  checkedInAt: string;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export type EventPhoto = {
  id: string;
  eventId: string;
  userId: string;
  image: string;
  caption?: string | null;
  createdAt: string;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export type ConvoyShare = {
  id: string;
  eventId: string;
  userId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  updatedAt: string;
  expiresAt: string;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export type EventParkingZone = {
  id: string;
  eventId: string;
  label: string;
  latitude: number;
  longitude: number;
  color?: string | null;
};

export type EventWeather = {
  condition: string;
  tempF: number;
  precipChance: number;
  alert?: string;
};

export type Club = {
  id: string;
  slug: string;
  name: string;
  description: string;
  city?: string | null;
  image?: string | null;
  coverImage?: string | null;
  tags: string[];
  ownerId: string;
  memberCount: number;
  isPublic: boolean;
  requiresApproval: boolean;
  merchUrl?: string | null;
  parentClubId?: string | null;
  createdAt: string;
  owner?: { id: string; username: string; displayName: string; avatar: string };
  parentClub?: { id: string; slug: string; name: string; city?: string | null } | null;
  chapters?: Array<{ id: string; slug: string; name: string; city?: string | null; memberCount: number; image?: string | null }>;
  joined?: boolean;
  role?: string | null;
  joinRequestPending?: boolean;
  pendingRequestCount?: number;
  access?: "full" | "preview";
};

export type ClubJoinRequest = {
  id: string;
  clubId: string;
  userId: string;
  message?: string | null;
  status: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatar: string };
};

export type ClubMember = {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; username: string; displayName: string; avatar: string };
  duesPaid?: boolean;
};

export type ClubChallenge = {
  id: string;
  clubId: string;
  title: string;
  description: string;
  type: "photo-battle" | "attendance" | "build-of-month";
  startsAt: string;
  endsAt: string;
  status: string;
  winnerId?: string | null;
  winner?: { id: string; username: string; displayName: string; avatar: string } | null;
  createdAt: string;
  entryCount: number;
  entries: Array<{
    id: string;
    userId: string;
    postId?: string | null;
    createdAt: string;
    user: { id: string; username: string; displayName: string; avatar: string };
    post?: { id: string; image: string; caption: string } | null;
  }>;
  leaderboard: Array<{
    userId: string;
    score: number;
    user: { id: string; username: string; displayName: string; avatar: string };
  }>;
};

export type ClubProject = {
  id: string;
  clubId: string;
  vehicleId?: string | null;
  title: string;
  description: string;
  coverImage?: string | null;
  contributorIds: string[];
  status: string;
  createdAt: string;
  vehicle?: {
    id: string;
    year: number;
    make: string;
    model: string;
    image?: string | null;
    slug?: string | null;
  } | null;
  contributors: Array<{ id: string; username: string; displayName: string; avatar: string }>;
};

export type ClubDuesEntry = {
  id: string;
  clubId: string;
  userId: string;
  amount: number;
  label: string;
  paidAt?: string | null;
  recordedById: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatar: string };
  recordedBy: { id: string; username: string; displayName: string; avatar: string };
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
};

export type Conversation = {
  id: string;
  type?: string;
  participantIds?: string[];
  participantCount?: number;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  otherUser?: { id: string; username: string; displayName: string; avatar: string } | null;
  groupName?: string;
  groupImage?: string | null;
};

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  vehicleId?: string | null;
  modId?: string | null;
  title: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  category: MarketplaceCategoryId;
  condition: "new" | "like-new" | "good" | "fair" | "project";
  image: string;
  images?: string[];
  location: string;
  fitmentTags?: string[];
  createdAt: string;
  tradeAccepted: boolean;
  partNumber?: string;
  soldAt?: string | null;
  soldPrice?: number;
  latitude?: number;
  longitude?: number;
  isBundle?: boolean;
  boostedUntil?: string | null;
  featured?: boolean;
};

export type TradeOffer = {
  id: string;
  listingId: string;
  fromUserId: string;
  toUserId: string;
  message?: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  listing?: MarketplaceListing;
  fromUser?: { id: string; username: string; displayName: string; avatar: string };
  toUser?: { id: string; username: string; displayName: string; avatar: string };
};

export type ListingTransaction = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: "requested" | "accepted" | "shipped" | "completed" | "cancelled" | "disputed";
  amount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: { id: string; title: string; image: string };
};

export type PriceHistory = {
  min: number;
  max: number;
  avg: number;
  count: number;
  points: { price: number; soldAt: string }[];
};

export type SavedSearch = {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
  createdAt: string;
};

export type MaintenanceLog = {
  id: string;
  userId: string;
  vehicleId: string;
  title: string;
  description: string;
  mileage: number;
  cost?: number;
  performedAt: string;
  category: string;
  receiptImage?: string | null;
  shopName?: string | null;
  serviceType?: "diy" | "shop" | null;
  reminderAt?: string | null;
  nextDueDate?: string | null;
  nextDueMileage?: number;
  difficulty?: number;
  vehicle?: { year: number; make: string; model: string; id?: string };
};

export type VehicleSpecSheet = {
  vehicle: Vehicle;
  owner: User;
  installedMods: Modification[];
  plannedMods: Modification[];
  buildLogs: BuildLog[];
  latestDyno?: { hp?: number; torque?: number; trackName?: string; lapTime?: string };
  totalEstimatedCost: number;
};

export type ShopSummary = {
  name: string;
  visitCount: number;
  lastVisit?: string;
};

export type ShopRatingSummary = {
  shopName: string;
  averageRating: number | null;
  ratingCount: number;
  userRating?: { rating: number; review: string | null } | null;
};

export type BenchSummary = {
  maintenanceStreak: number;
  lastMaintenanceAt: string | null;
  diySavings: number;
  diyCount: number;
  shopCount: number;
};

export type ServiceSuggestion = {
  category: string;
  label: string;
  reason: string;
  suggestedTitle: string;
  dueByMileage?: number;
  dueByDate?: string;
  urgency: "due" | "due_soon" | "overdue";
  vehicleId?: string;
};

export type ManualGuideNote = {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  yearRange?: string | null;
  section: string;
  tip: string;
  upvotes: number;
  createdAt: string;
  user: { username: string; displayName: string; avatar: string | null };
};

export type ServiceManual = {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  yearRange: string;
  yearStart?: number;
  yearEnd?: number;
  title: string;
  sections: string[];
  sourceUrl?: string;
  sourceLabel?: string;
  manualType?: "oem" | "workshop" | "owner" | "archive" | "tsb";
  searchText?: string;
};

export type EditPreset = {
  id: string;
  name: string;
  adjustments: import("@/lib/image-editor-presets").ImageAdjustments;
  filterId?: string | null;
  createdAt: string;
};

export type UserSettings = {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  activityAlerts: boolean;
  messageAlerts: boolean;
  meetReminders: boolean;
  marketplaceAlerts: boolean;
  weeklyDigest: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  nearYouRadius?: number;
  profileVisibility: string;
  showLocation: boolean;
  showGarage: boolean;
  allowMessages: string;
  theme: string;
  sceneTags: string[];
  alwaysWatermarkExports?: boolean;
  alwaysBlurPlates?: boolean;
};
