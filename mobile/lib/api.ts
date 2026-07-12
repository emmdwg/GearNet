import Constants from "expo-constants";
import { Platform } from "react-native";
import type {
  Club,
  ClubChallenge,
  ClubDetail,
  ClubDuesEntry,
  ClubJoinRequest,
  ClubProject,
  Comment,
  Conversation,
  Event,
  EventCheckIn,
  EventParkingZone,
  EventPhoto,
  EventWeather,
  ConvoyShare,
  FollowStats,
  MaintenanceLog,
  ManualSuggestion,
  MarketplaceListing,
  Message,
  Notification,
  PitUpdate,
  PitUpdateDetail,
  Post,
  PostDetail,
  PostType,
  ProfileView,
  LikeTargetType,
  RouteStop,
  SavedSearch,
  ServiceManual,
  BenchSummary,
  ManualGuideNote,
  ServiceSuggestion,
  ShopRatingSummary,
  ShopSummary,
  SocialTargetType,
  TradeOffer,
  User,
  UserProfile,
  UserSettings,
  Vehicle,
  VehicleDetail,
  VehicleSpecSheet,
} from "./types";

export type BookmarkTargetType = "post" | "listing";

function resolveApiUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromEnv = (
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    extra?.apiUrl?.trim() ||
    ""
  ).replace(/\/$/, "");

  if (fromEnv && fromEnv.length > 0 && !fromEnv.includes("YOUR_LAN_IP")) {
    if (__DEV__ && (fromEnv.includes("localhost") || fromEnv.includes("127.0.0.1"))) {
      // fall through to debugger host detection for physical devices
    } else {
      return fromEnv;
    }
  }

  if (__DEV__) {
    const debuggerHost =
      Constants.expoGoConfig?.debuggerHost ??
      Constants.expoConfig?.hostUri ??
      (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
    const host = typeof debuggerHost === "string" ? debuggerHost.split(":")[0] : null;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:3000`;
    }
    if (Platform.OS === "android") return "http://10.0.2.2:3000";
    return "http://127.0.0.1:3000";
  }

  return fromEnv && fromEnv.length > 0 ? fromEnv : "https://gearnetapp.com";
}

export const API_URL = resolveApiUrl();

function hasVerifiedManualUrl(manual: ServiceManual) {
  return typeof manual.sourceUrl === "string" && manual.sourceUrl.trim().length > 0;
}

function withResolvedManuals(manuals: ServiceManual[]) {
  return manuals.filter(hasVerifiedManualUrl);
}

function normalizeServiceManualsResponse(data: unknown): {
  results: ServiceManual[];
  total: number;
  vehicleTotal: number;
  vehicleCount: number;
  phase: number;
} {
  if (Array.isArray(data)) {
    const results = withResolvedManuals(data);
    return { results, total: results.length, vehicleTotal: results.length, vehicleCount: results.length, phase: 1 };
  }
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const results = withResolvedManuals(
      Array.isArray(record.results) ? (record.results as ServiceManual[]) : [],
    );
    const vehicleTotal =
      typeof record.vehicleTotal === "number"
        ? record.vehicleTotal
        : typeof record.count === "number"
          ? record.count
          : results.length;
    const vehicleCount =
      typeof record.vehicleCount === "number" ? record.vehicleCount : vehicleTotal;
    return {
      results,
      total: typeof record.total === "number" ? record.total : results.length,
      vehicleTotal,
      vehicleCount,
      phase: typeof record.phase === "number" ? record.phase : 1,
    };
  }
  return { results: [], total: 0, vehicleTotal: 0, vehicleCount: 0, phase: 1 };
}

const REQUEST_TIMEOUT_MS = 20_000;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `API error: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Could not reach GearNet API at ${API_URL}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function pingHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  register: (data: { email: string; password: string; username: string; displayName: string; avatar?: string; ref?: string }) =>
    fetchApi<{ id: string; username: string; needsEmailVerification?: boolean }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  completeProfile: (data: { username: string; displayName: string; phone?: string; avatar?: string }) =>
    fetchApi<{ id: string; username: string }>("/api/auth/complete-profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () =>
    fetchApi<{
      authenticated: boolean;
      user?: { id: string; username: string; name: string; email: string; image: string };
      error?: string;
      message?: string;
    }>("/api/me"),

  getPosts: (
    filter?: "all" | "photos" | "builds" | "for-sale",
    coords?: { lat: number; lng: number }
  ) => {
    const params = new URLSearchParams();
    if (filter && filter !== "all") params.set("filter", filter);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    const qs = params.toString();
    return fetchApi<Post[]>(qs ? `/api/posts?${qs}` : "/api/posts");
  },
  getPitUpdates: () => fetchApi<PitUpdate[]>("/api/pit-updates"),
  getEvents: () => fetchApi<Event[]>("/api/events"),
  getListings: () => fetchApi<MarketplaceListing[]>("/api/marketplace"),
  getVehicles: () => fetchApi<Vehicle[]>("/api/vehicles"),
  getMaintenanceLogs: () => fetchApi<MaintenanceLog[]>("/api/maintenance"),

  getBenchSummary: () => fetchApi<BenchSummary>("/api/maintenance?type=summary"),

  getMyShops: () => fetchApi<ShopSummary[]>("/api/shops?scope=mine"),

  getShopRatings: (shopName: string) =>
    fetchApi<ShopRatingSummary>(`/api/shops/ratings?shopName=${encodeURIComponent(shopName)}`),

  rateShop: (data: { shopName: string; rating: number; review?: string }) =>
    fetchApi<{ id: string }>("/api/shops/rate", { method: "POST", body: JSON.stringify(data) }),

  getServiceSuggestions: (vehicleId: string) =>
    fetchApi<{ suggestions: ServiceSuggestion[]; currentMileage: number }>(
      `/api/vehicles/${vehicleId}/service-suggestions`,
    ),

  getManualGuideNotes: (make: string, model: string) =>
    fetchApi<{ notes: ManualGuideNote[] }>(
      `/api/manuals/notes?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    ),

  createManualGuideNote: (data: {
    vehicleMake: string;
    vehicleModel: string;
    section: string;
    tip: string;
    yearRange?: string;
  }) => fetchApi<ManualGuideNote>("/api/manuals/notes", { method: "POST", body: JSON.stringify(data) }),

  upvoteManualGuideNote: (id: string) =>
    fetchApi<{ id: string; upvotes: number }>(`/api/manuals/notes/${id}/upvote`, { method: "POST" }),

  getVehicleRecalls: (vehicleId: string) =>
    fetchApi<{ recalls: unknown[]; acknowledged: string[] }>(`/api/vehicles/${vehicleId}/recalls`),

  acknowledgeRecall: (vehicleId: string, campaignNumber: string) =>
    fetchApi<{ acknowledged: string }>(`/api/vehicles/${vehicleId}/recalls`, {
      method: "POST",
      body: JSON.stringify({ campaignNumber }),
    }),

  getShops: (scope?: "mine") =>
    fetchApi<ShopSummary[]>(scope ? `/api/shops?scope=${scope}` : "/api/shops"),

  getServiceManuals: async (limit = 48, offset = 0) =>
    normalizeServiceManualsResponse(
      await fetchApi<unknown>(`/api/maintenance?type=manuals&limit=${limit}&offset=${offset}`),
    ),
  searchManuals: async (q: string, limit = 100) => {
    const data = await fetchApi<{
      suggestions?: ManualSuggestion[];
      results?: ServiceManual[];
      total?: number;
    }>(`/api/manuals/search?q=${encodeURIComponent(q)}&limit=${limit}&suggestions=8`);
    return {
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      results: withResolvedManuals(Array.isArray(data.results) ? data.results : []),
      total: typeof data.total === "number" ? data.total : 0,
    };
  },
  getConversations: () => fetchApi<Conversation[]>("/api/conversations"),

  openClubCrewChat: (slug: string) =>
    fetchApi<{ conversationId: string }>(`/api/clubs/${encodeURIComponent(slug)}/crew-chat`, { method: "POST" }),

  openEventCrewChat: (eventId: string) =>
    fetchApi<{ conversationId: string }>(`/api/events/${eventId}/crew-chat`, { method: "POST" }),

  deleteConversation: (conversationId: string) =>
    fetchApi<{ ok: boolean }>(`/api/conversations/${conversationId}`, { method: "DELETE" }),
  getMessages: (conversationId: string) =>
    fetchApi<{ messages: import("./types").Message[]; otherLastReadAt: string | null }>(
      `/api/conversations/${conversationId}/messages`
    ),

  markConversationRead: (conversationId: string) =>
    fetchApi<{ lastReadAt: string; otherLastReadAt: string | null }>(
      `/api/conversations/${conversationId}/read`,
      { method: "POST" }
    ),

  sendMessage: (conversationId: string, content: string, imageUrl?: string, audioUrl?: string) =>
    fetchApi<import("./types").Message & { otherLastReadAt?: string | null }>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content, imageUrl, audioUrl }),
      }
    ),

  rsvpEvent: (eventId: string) =>
    fetchApi<{ rsvped: boolean }>(`/api/events/${eventId}/rsvp`, { method: "POST" }),

  getUser: (username: string) =>
    fetchApi<{ user: User; vehicles: Vehicle[]; posts: Post[]; followStats: FollowStats; view: ProfileView }>(
      `/api/users/${username}`
    ),

  getFollowers: (username: string) =>
    fetchApi<{ users: User[] }>(`/api/users/${encodeURIComponent(username)}/followers`),

  getFollowing: (username: string) =>
    fetchApi<{ users: User[] }>(`/api/users/${encodeURIComponent(username)}/following`),

  getSuggestedUsers: () => fetchApi<{ users: User[] }>("/api/users/suggested"),

  toggleFollow: (userId: string) =>
    fetchApi<FollowStats & { following: number; followRequestPending?: boolean }>("/api/follows", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  getFollowRequests: () =>
    fetchApi<{
      requests: { id: string; createdAt: string; requester: User }[];
    }>("/api/follow-requests"),

  reviewFollowRequest: (requestId: string, action: "approve" | "reject") =>
    fetchApi<{ status: string }>(`/api/follow-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),

  toggleBookmark: (targetType: BookmarkTargetType, targetId: string) =>
    fetchApi<{ bookmarked: boolean }>("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId }),
    }),

  getBookmarks: () =>
    fetchApi<{
      posts: Post[];
      listings: MarketplaceListing[];
      postIds: string[];
      listingIds: string[];
    }>("/api/bookmarks"),

  updatePost: (
    id: string,
    data: {
      caption?: string;
      tags?: string[];
      images?: string[];
      mediaType?: "image" | "video";
      videoUrl?: string;
      videoDuration?: number;
      videoPoster?: string;
      vehicleId?: string | null;
      postType?: PostType;
      beforeImage?: string | null;
      afterImage?: string | null;
      inspiredByPostId?: string | null;
      collaborators?: string[];
      audioUrl?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      status?: "draft" | "published";
    }
  ) => fetchApi<Post>(`/api/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deletePost: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/posts/${id}`, { method: "DELETE" }),

  updateListing: (
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      category?: string;
      condition?: string;
      location?: string;
      tradeAccepted?: boolean;
      vehicleId?: string | null;
      fitmentTags?: string[];
      images?: string[];
    }
  ) => fetchApi<MarketplaceListing>(`/api/marketplace/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteListing: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/marketplace/${id}`, { method: "DELETE" }),

  updateVehicle: (
    id: string,
    data: {
      year?: number;
      make?: string;
      model?: string;
      trim?: string;
      color?: string;
      image?: string;
      vin?: string;
      projectStatus?: string;
      buildProgress?: number;
      forSale?: boolean;
      fluidNotes?: string | null;
    }
  ) => fetchApi<Vehicle>(`/api/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteVehicle: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/vehicles/${id}`, { method: "DELETE" }),

  createPost: (data: {
    images?: string[];
    mediaType?: "image" | "video";
    videoUrl?: string;
    videoDuration?: number;
    videoPoster?: string;
    caption: string;
    tags?: string[];
    clubId?: string;
    vehicleId?: string;
    postType?: PostType;
    beforeImage?: string;
    afterImage?: string;
    inspiredByPostId?: string;
    collaborators?: string[];
    audioUrl?: string;
    latitude?: number;
    longitude?: number;
    status?: "draft" | "published";
  }) => fetchApi<Post>("/api/posts", { method: "POST", body: JSON.stringify(data) }),

  toggleLike: (targetType: LikeTargetType, targetId: string, reactionType?: string) =>
    fetchApi<{ liked: boolean; reactionType?: string | null }>(
      reactionType ? "/api/likes" : "/api/likes",
      {
        method: reactionType ? "PATCH" : "POST",
        body: JSON.stringify(
          reactionType
            ? { targetType, targetId, reactionType }
            : { targetType, targetId },
        ),
      },
    ),

  setReaction: (targetType: "post" | "pit_update", targetId: string, reactionType: string) =>
    fetchApi<{ liked: boolean; reactionType: string | null }>("/api/likes", {
      method: "PATCH",
      body: JSON.stringify({ targetType, targetId, reactionType }),
    }),

  getDraftPosts: () => fetchApi<Post[]>("/api/posts?status=draft"),

  decodeVin: (vin: string) =>
    fetchApi<{ vin: string; year?: number; make?: string; model?: string; trim?: string }>(
      "/api/vehicles/decode-vin",
      { method: "POST", body: JSON.stringify({ vin }) },
    ),

  getComments: (targetType: SocialTargetType, targetId: string) =>
    fetchApi<Comment[]>(
      `/api/comments?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
    ),

  addComment: (
    targetType: SocialTargetType,
    targetId: string,
    content: string,
    parentId?: string,
    quotedCommentId?: string
  ) =>
    fetchApi<Comment>("/api/comments", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId, content, parentId, quotedCommentId }),
    }),

  deleteComment: (id: string) =>
    fetchApi<{ ok: boolean }>(`/api/comments/${id}`, { method: "DELETE" }),

  deleteAccount: () => fetchApi<{ ok: boolean }>("/api/account", { method: "DELETE" }),

  getNotifications: () =>
    fetchApi<{ items: Notification[]; unreadCount: number }>("/api/notifications"),

  markNotificationsRead: () =>
    fetchApi<{ ok: boolean }>("/api/notifications", { method: "PATCH" }),

  getSettings: () =>
    fetchApi<{ settings: UserSettings; profile: UserProfile }>("/api/settings"),

  updateSettings: (data: { settings?: Partial<UserSettings>; profile?: Partial<UserProfile> }) =>
    fetchApi<{ ok: boolean }>("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),

  getPitUpdateDetail: (id: string) => fetchApi<PitUpdateDetail>(`/api/pit-updates/${id}`),

  getPostDetail: (id: string) => fetchApi<PostDetail>(`/api/posts/${id}`),

  createPitUpdate: (data: {
    image: string;
    slides?: { image: string; caption?: string }[];
    caption: string;
    visibility?: "public" | "followers" | "crew" | "private";
    latitude?: number;
    longitude?: number;
  }) =>
    fetchApi<PitUpdate>("/api/pit-updates", { method: "POST", body: JSON.stringify(data) }),

  createVehicle: (data: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    color: string;
    image: string;
    vin?: string;
    projectStatus?: string;
    buildProgress?: number;
  }) => fetchApi<Vehicle>("/api/vehicles", { method: "POST", body: JSON.stringify(data) }),

  createEvent: (data: {
    title: string;
    description: string;
    location: string;
    city: string;
    date: string;
    time: string;
    tags?: string[];
    image: string;
    clubId?: string;
    recurringRule?: string;
    routeJson?: RouteStop[];
    isOutdoor?: boolean;
    ticketPrice?: number;
    ticketUrl?: string;
    latitude?: number;
    longitude?: number;
  }) => fetchApi<Event>("/api/events", { method: "POST", body: JSON.stringify(data) }),

  getClubs: () => fetchApi<Club[]>("/api/clubs"),
  getClub: (slug: string) => fetchApi<ClubDetail>(`/api/clubs/${encodeURIComponent(slug)}`),
  createClub: (data: {
    name: string;
    description: string;
    city?: string;
    tags?: string[];
    image?: string;
    coverImage?: string;
    isPublic?: boolean;
    requiresApproval?: boolean;
  }) => fetchApi<Club>("/api/clubs", { method: "POST", body: JSON.stringify(data) }),
  updateClub: (
    slug: string,
    data: {
      name?: string;
      description?: string;
      city?: string;
      tags?: string[];
      image?: string | null;
      coverImage?: string | null;
      isPublic?: boolean;
      requiresApproval?: boolean;
      merchUrl?: string | null;
    }
  ) => fetchApi<Club>(`/api/clubs/${encodeURIComponent(slug)}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteClub: (slug: string) =>
    fetchApi<{ deleted: boolean }>(`/api/clubs/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  joinClub: (slug: string, data?: { message?: string }) =>
    fetchApi<{ joined?: boolean; requested?: boolean; joinRequestPending?: boolean; role?: string }>(
      `/api/clubs/${encodeURIComponent(slug)}/join`,
      { method: "POST", body: JSON.stringify(data ?? {}) }
    ),
  leaveClub: (slug: string) =>
    fetchApi<{ left?: boolean; cancelled?: boolean }>(`/api/clubs/${encodeURIComponent(slug)}/join`, { method: "DELETE" }),
  getClubJoinRequests: (slug: string) =>
    fetchApi<ClubJoinRequest[]>(`/api/clubs/${encodeURIComponent(slug)}/requests`),
  reviewClubJoinRequest: (slug: string, requestId: string, action: "approve" | "reject") =>
    fetchApi<{ status: string }>(`/api/clubs/${encodeURIComponent(slug)}/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),

  getClubChallenges: (slug: string) =>
    fetchApi<ClubChallenge[]>(`/api/clubs/${encodeURIComponent(slug)}/challenges`),
  createClubChallenge: (
    slug: string,
    data: { title: string; description?: string; type: string; startsAt: string; endsAt: string }
  ) =>
    fetchApi<ClubChallenge>(`/api/clubs/${encodeURIComponent(slug)}/challenges`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  enterClubChallenge: (slug: string, challengeId: string, postId: string) =>
    fetchApi<{ id: string }>(`/api/clubs/${encodeURIComponent(slug)}/challenges/${challengeId}/enter`, {
      method: "POST",
      body: JSON.stringify({ postId }),
    }),

  getClubChapters: (slug: string) =>
    fetchApi<Array<{ id: string; slug: string; name: string; city?: string | null; memberCount: number }>>(
      `/api/clubs/${encodeURIComponent(slug)}/chapters`
    ),
  createClubChapter: (slug: string, data: { name: string; description: string; city?: string | null }) =>
    fetchApi<{ slug: string }>(`/api/clubs/${encodeURIComponent(slug)}/chapters`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getClubProjects: (slug: string) => fetchApi<ClubProject[]>(`/api/clubs/${encodeURIComponent(slug)}/projects`),
  createClubProject: (
    slug: string,
    data: { title: string; description?: string; vehicleId?: string | null }
  ) =>
    fetchApi<ClubProject>(`/api/clubs/${encodeURIComponent(slug)}/projects`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getClubDues: (slug: string) => fetchApi<ClubDuesEntry[]>(`/api/clubs/${encodeURIComponent(slug)}/dues`),
  recordClubDues: (slug: string, data: { userId: string; amount: number; label: string }) =>
    fetchApi<ClubDuesEntry>(`/api/clubs/${encodeURIComponent(slug)}/dues`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getVehicle: (id: string) => fetchApi<VehicleDetail>(`/api/vehicles/${id}`),
  createBuildLog: (
    vehicleId: string,
    data: {
      title: string;
      content: string;
      milestoneType?: string;
      images?: string[];
      dynoHp?: number;
      dynoTorque?: number;
      lapTime?: string;
      trackName?: string;
    }
  ) =>
    fetchApi(`/api/vehicles/${vehicleId}/build-logs`, { method: "POST", body: JSON.stringify(data) }),
  createMod: (
    vehicleId: string,
    data: {
      name: string;
      category: string;
      status?: "installed" | "planned";
      installedAt?: string;
      estimatedCost?: number;
      notes?: string;
      videoUrl?: string;
      affiliateUrl?: string;
      partType?: "oem" | "aftermarket" | "custom";
    }
  ) => fetchApi(`/api/vehicles/${vehicleId}/mods`, { method: "POST", body: JSON.stringify(data) }),

  boostListing: (id: string) =>
    fetchApi<{ ok: boolean; boostedUntil: string | null }>(`/api/marketplace/${id}/boost`, { method: "POST" }),

  boostEvent: (id: string) =>
    fetchApi<{ ok: boolean; boostedUntil: string | null }>(`/api/events/${id}/boost`, { method: "POST" }),

  activateProTrial: () =>
    fetchApi<{ ok: boolean; pro: { isPro: boolean; proExpiresAt: string | null } }>("/api/settings/pro", {
      method: "POST",
      body: JSON.stringify({ action: "trial" }),
    }),

  setGarageSlug: (garageSlug: string) =>
    fetchApi<{ ok: boolean; garageSlug: string | null }>("/api/settings/pro", {
      method: "POST",
      body: JSON.stringify({ action: "setSlug", garageSlug }),
    }),

  getGarageAnalytics: () =>
    fetchApi<{ profileViews: number; vehicleCount: number; modSpendTotal: number }>("/api/garage/analytics"),

  requestVerifiedSeller: () =>
    fetchApi<{ ok: boolean }>("/api/settings/verified-seller", { method: "POST" }),

  requestVerifiedShop: () =>
    fetchApi<{ ok: boolean }>("/api/settings/verified-shop", { method: "POST" }),

  createListing: (data: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    location: string;
    tradeAccepted?: boolean;
    vehicleId?: string;
    modId?: string;
    fitmentTags?: string[];
    images: string[];
  }) => fetchApi<MarketplaceListing>("/api/marketplace", { method: "POST", body: JSON.stringify(data) }),

  createMaintenance: (data: {
    vehicleId: string;
    title: string;
    description: string;
    mileage: number;
    cost?: number;
    category: string;
    performedAt: string;
    shopName?: string;
    receiptImage?: string;
    reminderAt?: string;
  }) => fetchApi<MaintenanceLog>("/api/maintenance", { method: "POST", body: JSON.stringify(data) }),

  getDiscoverNearYou: (lat: number, lng: number, radius = 50, limit = 20) =>
    fetchApi<Post[]>(`/api/discover/near-you?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`),

  getTrendingBuilds: (limit = 20) =>
    fetchApi<Post[]>(`/api/discover/trending-builds?limit=${limit}`),

  getBuildOfWeek: () => fetchApi<{ post: Post | null }>("/api/discover/build-of-week"),

  getBuildersLikeYou: (limit = 8) =>
    fetchApi<
      { id: string; username: string; displayName: string; avatar: string; bio: string; matchReason?: string }[]
    >(`/api/discover/builders-like-you?limit=${limit}`),

  getLocalHero: (city: string) =>
    fetchApi<{ hero: { username: string; displayName: string; city: string; postCount: number } | null }>(
      `/api/discover/local-hero?city=${encodeURIComponent(city)}`
    ).then((d) => d.hero),

  getMyReferrals: () =>
    fetchApi<{
      referralCount: number;
      referrals: { username: string; displayName: string; joinedAt: string }[];
    }>("/api/users/me/referrals"),

  hidePost: (postId: string) =>
    fetchApi<{ hidden: boolean }>(`/api/posts/${postId}/hide`, { method: "POST" }),

  muteUser: (userId: string) =>
    fetchApi<{ muted: boolean }>(`/api/users/mute/${userId}`, { method: "POST" }),

  unmuteUser: (userId: string) =>
    fetchApi<{ muted: boolean }>(`/api/users/mute/${userId}`, { method: "DELETE" }),

  getCollections: () =>
    fetchApi<
      { id: string; name: string; postIds: string[]; count: number; createdAt: string; thumbnails?: string[] }[]
    >("/api/collections"),

  getCollection: (id: string) =>
    fetchApi<{ id: string; name: string; createdAt: string; posts: Post[] }>(`/api/collections/${id}`),

  createCollection: (name: string) =>
    fetchApi<{ id: string; name: string; postIds: string[]; count: number; createdAt: string }>("/api/collections", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  addToCollection: (collectionId: string, postId: string) =>
    fetchApi<{ ok: boolean }>(`/api/collections/${collectionId}/items`, {
      method: "POST",
      body: JSON.stringify({ postId }),
    }),

  getEventCheckIns: (eventId: string) => fetchApi<EventCheckIn[]>(`/api/events/${eventId}/checkin`),

  checkInEvent: (eventId: string, data?: { latitude?: number; longitude?: number }) =>
    fetchApi<EventCheckIn>(`/api/events/${eventId}/checkin`, { method: "POST", body: JSON.stringify(data ?? {}) }),

  getEventPhotos: (eventId: string) => fetchApi<EventPhoto[]>(`/api/events/${eventId}/photos`),

  uploadEventPhoto: (eventId: string, data: { image: string; caption?: string }) =>
    fetchApi<EventPhoto>(`/api/events/${eventId}/photos`, { method: "POST", body: JSON.stringify(data) }),

  getEventConvoy: (eventId: string) => fetchApi<ConvoyShare[]>(`/api/events/${eventId}/convoy`),

  updateConvoyLocation: (eventId: string, data: { latitude: number; longitude: number; heading?: number }) =>
    fetchApi<ConvoyShare>(`/api/events/${eventId}/convoy`, { method: "POST", body: JSON.stringify(data) }),

  stopConvoySharing: (eventId: string) =>
    fetchApi<{ stopped: boolean }>(`/api/events/${eventId}/convoy`, { method: "DELETE" }),

  getEventWeather: (eventId: string) => fetchApi<EventWeather>(`/api/events/${eventId}/weather`),

  getEventParkingZones: (eventId: string) => fetchApi<EventParkingZone[]>(`/api/events/${eventId}/parking-zones`),

  addEventParkingZone: (eventId: string, data: { label: string; latitude: number; longitude: number; color?: string }) =>
    fetchApi<EventParkingZone>(`/api/events/${eventId}/parking-zones`, { method: "POST", body: JSON.stringify(data) }),

  getEventRsvp: (eventId: string) =>
    fetchApi<{ rsvped: boolean; rsvpStatus: string | null }>(`/api/events/${eventId}/rsvp`),

  getTradeOffers: (role?: "all" | "sent" | "received") =>
    fetchApi<TradeOffer[]>(`/api/marketplace/trade-offers${role ? `?role=${role}` : ""}`),

  createTradeOffer: (data: { listingId: string; message?: string }) =>
    fetchApi<TradeOffer>("/api/marketplace/trade-offers", { method: "POST", body: JSON.stringify(data) }),

  updateTradeOffer: (id: string, status: "accepted" | "declined" | "withdrawn") =>
    fetchApi<TradeOffer>(`/api/marketplace/trade-offers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getSavedSearches: () => fetchApi<SavedSearch[]>("/api/marketplace/saved-searches"),

  createSavedSearch: (data: { name: string; query?: string; filters?: Record<string, unknown> }) =>
    fetchApi<SavedSearch>("/api/marketplace/saved-searches", { method: "POST", body: JSON.stringify(data) }),

  deleteSavedSearch: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/marketplace/saved-searches?id=${encodeURIComponent(id)}`, { method: "DELETE" }),

  setPrimaryVehicle: (vehicleId: string | null) =>
    fetchApi<{ primaryVehicleId: string | null; primaryVehicle?: Vehicle | null }>("/api/users/me/primary-vehicle", {
      method: "PATCH",
      body: JSON.stringify({ vehicleId }),
    }),

  getSpecSheet: (vehicleId: string) => fetchApi<VehicleSpecSheet>(`/api/vehicles/${vehicleId}/spec-sheet`),

  createConversation: (participantId: string, initialMessage?: string) =>
    fetchApi<{ id: string }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId, initialMessage }),
    }),

  getPriceHistory: (params: { partNumber?: string; fitmentTag?: string }) => {
    const q = params.partNumber
      ? `partNumber=${encodeURIComponent(params.partNumber)}`
      : `fitmentTag=${encodeURIComponent(params.fitmentTag ?? "")}`;
    return fetchApi<import("./types").PriceHistory>(`/api/marketplace/price-history?${q}`);
  },

  checkListingFitment: (listingId: string) =>
    fetchApi<{ matches: import("./types").FitmentMatch[]; anyMatch: boolean }>(
      `/api/marketplace/${listingId}/fitment-check`,
    ),

  getMeetupSpots: (listingId: string) =>
    fetchApi<{ spots: import("./types").MeetupSpot[] }>(`/api/marketplace/${listingId}/meetup-spots`),

  getListingEscrow: (listingId: string) =>
    fetchApi<import("./types").ListingTransaction | null>(`/api/marketplace/${listingId}/escrow`),

  requestListingEscrow: (listingId: string, notes?: string) =>
    fetchApi<import("./types").ListingTransaction>(`/api/marketplace/${listingId}/escrow`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),

  updateListingTransaction: (id: string, action: string) =>
    fetchApi<import("./types").ListingTransaction>(`/api/marketplace/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),

  getMeetPins: () => fetchApi<import("./types").MeetPin[]>("/api/meet-pins"),

  autocompletePlaces: (q: string, bias?: { lat: number; lng: number }) => {
    const params = new URLSearchParams({ q });
    if (bias) {
      params.set("lat", String(bias.lat));
      params.set("lng", String(bias.lng));
    }
    return fetchApi<{ suggestions: import("../components/ui/PlaceAutocompleteInput").PlaceSuggestion[] }>(
      `/api/places/autocomplete?${params}`,
    ).then((r) => r.suggestions);
  },

  createMeetPin: (data: {
    title: string;
    latitude: number;
    longitude: number;
    address?: string;
    description?: string;
    pinType?: "meet" | "dyno";
    dynoHp?: number;
    expiresAt?: string;
  }) =>
    fetchApi<import("./types").MeetPin>("/api/meet-pins", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateMeetPin: (id: string, data: { title?: string; description?: string }) =>
    fetchApi<import("./types").MeetPin>(`/api/meet-pins/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteMeetPin: (id: string) =>
    fetchApi<{ ok: boolean }>(`/api/meet-pins/${encodeURIComponent(id)}`, { method: "DELETE" }),

  reportPost: (postId: string, reason: string, details?: string) =>
    fetchApi<{ ok: boolean }>(`/api/posts/${encodeURIComponent(postId)}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, details }),
    }),

  reportListing: (listingId: string, reason: string, details?: string) =>
    fetchApi<{ ok: boolean }>(`/api/marketplace/${encodeURIComponent(listingId)}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, details }),
    }),

  getMutedUsers: () =>
    fetchApi<{ id: string; username: string; displayName: string; avatar: string; mutedAt: string }[]>(
      "/api/users/muted",
    ),

  getCrew: () =>
    fetchApi<{
      members: { userId: string; username: string; displayName: string; avatar: string }[];
      count: number;
    }>("/api/users/me/crew"),

  addCrewMember: (username: string) =>
    fetchApi<{ members: { userId: string; username: string; displayName: string; avatar: string }[]; count: number }>(
      "/api/users/me/crew",
      { method: "POST", body: JSON.stringify({ username }) },
    ),

  removeCrewMember: (userId: string) =>
    fetchApi<{ members: { userId: string; username: string; displayName: string; avatar: string }[]; count: number }>(
      `/api/users/me/crew?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    ),

  getBlockedUsers: () =>
    fetchApi<{ id: string; username: string; displayName: string; avatar: string; blockedAt: string }[]>(
      "/api/users/blocked",
    ),

  searchUsers: (q: string) =>
    fetchApi<{ id: string; username: string; displayName: string; avatar: string }[]>(
      `/api/users/search?q=${encodeURIComponent(q)}`
    ),

  search: (q: string) =>
    fetchApi<{
      users: User[];
      posts: Post[];
      vehicles: (Vehicle & { owner?: { username: string; displayName: string } })[];
      listings: MarketplaceListing[];
    }>(`/api/search?q=${encodeURIComponent(q)}`),

  getLikedPostIds: () => fetchApi<{ postIds: string[] }>("/api/likes"),

  getListing: (id: string) =>
    fetchApi<MarketplaceListing & { bookmarked?: boolean; seller: User }>(`/api/marketplace/${id}`),

  getPostsByTag: (tag: string) =>
    fetchApi<{ tag: string; posts: Post[]; trending: { tag: string; count: number }[] }>(
      `/api/tags/${encodeURIComponent(tag)}`
    ),

  getTrendingTags: () => fetchApi<{ tags: { tag: string; count: number }[] }>("/api/tags/trending"),

  getOnboarding: () =>
    fetchApi<{
      hasAvatar: boolean;
      hasVehicle: boolean;
      followCount: number;
      hasRsvp: boolean;
      hasJoinedClub: boolean;
      completed: boolean;
      dismissed: boolean;
    }>("/api/onboarding"),

  dismissOnboarding: () => fetchApi<{ ok: boolean }>("/api/onboarding", { method: "PATCH" }),

  changeUsername: (username: string) =>
    fetchApi<{ username: string }>("/api/settings/username", {
      method: "PATCH",
      body: JSON.stringify({ username }),
    }),

  getUsernameAvailability: () =>
    fetchApi<{ allowed: boolean; nextChangeAt: string | null }>("/api/settings/username"),

  blockUser: (userId: string) =>
    fetchApi<{ ok: boolean }>("/api/users/block", { method: "POST", body: JSON.stringify({ userId }) }),

  unblockUser: (userId: string) =>
    fetchApi<{ ok: boolean }>(`/api/users/block?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }),

  getBlockStatus: (userId: string) =>
    fetchApi<{ blocked: boolean }>(`/api/users/block?userId=${encodeURIComponent(userId)}`),

  reportUser: (data: { userId: string; reason: string; details?: string }) =>
    fetchApi<{ ok: boolean }>("/api/users/report", { method: "POST", body: JSON.stringify(data) }),

  registerPushToken: (token: string, platform: "expo" | "web") =>
    fetchApi<{ ok: boolean }>("/api/push/register", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    }),

  getTagFollows: () =>
    fetchApi<{ id: string; tag: string; tagType: string }[]>("/api/tag-follows"),

  toggleTagFollow: (tag: string, tagType: "hashtag" | "scene" = "hashtag") =>
    fetchApi<{ following: boolean }>("/api/tag-follows", {
      method: "POST",
      body: JSON.stringify({ tag, tagType }),
    }),

  getWeeklyDigest: () => fetchApi<Record<string, unknown>>("/api/digest/weekly"),

  searchPosts: (q: string, limit = 8) =>
    fetchApi<{ posts: Post[] } | Post[]>(`/api/posts?q=${encodeURIComponent(q)}&limit=${limit}`).then((data) =>
      Array.isArray(data) ? data : Array.isArray(data.posts) ? data.posts : [],
    ),

  getBuildReels: () =>
    fetchApi<
      {
        id: string;
        caption: string;
        videoUrl: string;
        videoPoster?: string | null;
        image?: string;
        user: { username: string; displayName: string; avatar: string };
      }[]
    >("/api/discover/build-reels"),

  getDiscoverChallenges: () =>
    fetchApi<
      {
        id: string;
        title: string;
        entryCount: number;
        club: { slug: string; name: string };
        leaders: { score: number; user: { username: string; displayName: string } }[];
      }[]
    >("/api/discover/challenges"),

  getVerifiedShopsMap: () =>
    fetchApi<
      {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
        latitude: number;
        longitude: number;
        location: string;
      }[]
    >("/api/shops/verified-map"),

  getSavedSearchPreviews: () =>
    fetchApi<
      { id: string; name: string; newCount: number; matches: MarketplaceListing[] }[]
    >("/api/marketplace/saved-searches/preview"),

  savePitHighlight: (pitId: string, vehicleId: string, slideIndex = 0) =>
    fetchApi<{ saved: boolean }>(`/api/pit-updates/${pitId}/highlights`, {
      method: "POST",
      body: JSON.stringify({ vehicleId, slideIndex }),
    }),

  updateMod: (id: string, data: { marketplaceAlert?: boolean }) =>
    fetchApi<unknown>(`/api/mods/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};
