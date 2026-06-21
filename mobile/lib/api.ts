import type {
  AuthUser,
  Comment,
  Conversation,
  Event,
  FollowStats,
  MaintenanceLog,
  MarketplaceListing,
  Message,
  Notification,
  PitUpdate,
  PitUpdateDetail,
  Post,
  PostDetail,
  LikeTargetType,
  ServiceManual,
  SocialTargetType,
  User,
  UserProfile,
  UserSettings,
  Vehicle,
} from "./types";

export type BookmarkTargetType = "post" | "listing";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

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
  register: (data: { email: string; password: string; username: string; displayName: string; avatar?: string }) =>
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
    }>("/api/me"),

  getPosts: () => fetchApi<Post[]>("/api/posts"),
  getPitUpdates: () => fetchApi<PitUpdate[]>("/api/pit-updates"),
  getEvents: () => fetchApi<Event[]>("/api/events"),
  getListings: () => fetchApi<MarketplaceListing[]>("/api/marketplace"),
  getVehicles: () => fetchApi<Vehicle[]>("/api/vehicles"),
  getMaintenanceLogs: () => fetchApi<MaintenanceLog[]>("/api/maintenance"),
  getServiceManuals: () => fetchApi<ServiceManual[]>("/api/maintenance?type=manuals"),
  getConversations: () => fetchApi<Conversation[]>("/api/conversations"),
  getMessages: (conversationId: string) =>
    fetchApi<Message[]>(`/api/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    fetchApi<Message>(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  rsvpEvent: (eventId: string) =>
    fetchApi<{ rsvped: boolean }>(`/api/events/${eventId}/rsvp`, { method: "POST" }),

  getUser: (username: string) =>
    fetchApi<{ user: User; vehicles: Vehicle[]; posts: Post[]; followStats: FollowStats }>(
      `/api/users/${username}`
    ),

  getFollowers: (username: string) =>
    fetchApi<{ users: User[] }>(`/api/users/${encodeURIComponent(username)}/followers`),

  getFollowing: (username: string) =>
    fetchApi<{ users: User[] }>(`/api/users/${encodeURIComponent(username)}/following`),

  getSuggestedUsers: () => fetchApi<{ users: User[] }>("/api/users/suggested"),

  toggleFollow: (userId: string) =>
    fetchApi<FollowStats & { following: number }>("/api/follows", {
      method: "POST",
      body: JSON.stringify({ userId }),
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

  updatePost: (id: string, data: { caption?: string; tags?: string[]; images?: string[] }) =>
    fetchApi<Post>(`/api/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

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
      images?: string[];
    }
  ) => fetchApi<MarketplaceListing>(`/api/marketplace/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteListing: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/marketplace/${id}`, { method: "DELETE" }),

  updateVehicle: (
    id: string,
    data: { year?: number; make?: string; model?: string; trim?: string; color?: string; image?: string }
  ) => fetchApi<Vehicle>(`/api/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteVehicle: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/vehicles/${id}`, { method: "DELETE" }),

  createPost: (data: { images: string[]; caption: string; tags?: string[] }) =>
    fetchApi<Post>("/api/posts", { method: "POST", body: JSON.stringify(data) }),

  toggleLike: (targetType: LikeTargetType, targetId: string) =>
    fetchApi<{ liked: boolean }>("/api/likes", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId }),
    }),

  getComments: (targetType: SocialTargetType, targetId: string) =>
    fetchApi<Comment[]>(
      `/api/comments?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
    ),

  addComment: (targetType: SocialTargetType, targetId: string, content: string, parentId?: string) =>
    fetchApi<Comment>("/api/comments", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId, content, parentId }),
    }),

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

  createPitUpdate: (data: { image: string; caption: string }) =>
    fetchApi<PitUpdate>("/api/pit-updates", { method: "POST", body: JSON.stringify(data) }),

  createVehicle: (data: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    color: string;
    image: string;
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
  }) => fetchApi<Event>("/api/events", { method: "POST", body: JSON.stringify(data) }),

  createListing: (data: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    location: string;
    tradeAccepted?: boolean;
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
  }) => fetchApi<MaintenanceLog>("/api/maintenance", { method: "POST", body: JSON.stringify(data) }),

  createConversation: (participantId: string) =>
    fetchApi<{ id: string }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId }),
    }),

  getMeetPins: () => fetchApi<import("./types").MeetPin[]>("/api/meet-pins"),

  createMeetPin: (data: {
    title: string;
    latitude: number;
    longitude: number;
    address?: string;
    description?: string;
  }) =>
    fetchApi<import("./types").MeetPin>("/api/meet-pins", {
      method: "POST",
      body: JSON.stringify(data),
    }),

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
};
