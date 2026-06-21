import { prisma } from "./prisma";
import { parseJsonArray } from "./api-helpers";
import { serializeImagesField } from "./social";

export async function getPosts() {
  const posts = await prisma.post.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return posts.map((post) => ({
    id: post.id,
    userId: post.userId,
    image: post.image,
    images: serializeImagesField(post.images, post.image),
    caption: post.caption,
    tags: parseJsonArray(post.tags),
    likes: post.likes,
    comments: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    user: serializeUser(post.user),
  }));
}

export async function getPitUpdates() {
  const now = new Date();
  const updates = await prisma.pitUpdate.findMany({
    where: { expiresAt: { gt: now } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return updates.map((u) => ({
    id: u.id,
    userId: u.userId,
    image: u.image,
    caption: u.caption,
    expiresAt: u.expiresAt.toISOString(),
    likes: u.likes,
    comments: u.commentCount,
    user: serializeUser(u.user),
  }));
}

export async function getEvents() {
  const events = await prisma.event.findMany({
    include: { organizer: true },
    orderBy: { date: "asc" },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    city: event.city,
    date: event.date.toISOString().split("T")[0],
    time: event.time,
    organizerId: event.organizerId,
    attendeeCount: event.attendeeCount,
    maxAttendees: event.maxAttendees,
    tags: parseJsonArray(event.tags),
    image: event.image ?? "",
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
    organizer: serializeUser(event.organizer),
  }));
}

export async function getMeetPins() {
  const pins = await prisma.meetPin.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return pins.map((pin) => ({
    id: pin.id,
    userId: pin.userId,
    title: pin.title,
    description: pin.description ?? "",
    latitude: pin.latitude,
    longitude: pin.longitude,
    address: pin.address ?? "",
    createdAt: pin.createdAt.toISOString(),
    user: serializeUser(pin.user),
  }));
}

export async function searchUsers(query: string, excludeUserId?: string) {
  const q = query.trim();
  if (!q) return [];

  const users = await prisma.user.findMany({
    where: {
      AND: [
        excludeUserId ? { id: { not: excludeUserId } } : {},
        {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    take: 10,
  });

  return users.map(serializeUser);
}

export async function getListingById(id: string) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: { seller: true },
  });
  if (!listing) return null;

  return {
    id: listing.id,
    sellerId: listing.sellerId,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category as "vehicle" | "parts" | "wheels" | "accessories" | "trade",
    condition: listing.condition as "new" | "like-new" | "good" | "fair" | "project",
    image: listing.image,
    images: serializeImagesField(listing.images, listing.image),
    location: listing.location,
    createdAt: listing.createdAt.toISOString(),
    tradeAccepted: listing.tradeAccepted,
    seller: serializeUser(listing.seller),
  };
}

export async function getPostsByTag(tag: string) {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return [];

  const posts = await prisma.post.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return posts
    .filter((post) => parseJsonArray(post.tags).some((t) => t.toLowerCase() === normalized))
    .map((post) => ({
      id: post.id,
      userId: post.userId,
      image: post.image,
      images: serializeImagesField(post.images, post.image),
      caption: post.caption,
      tags: parseJsonArray(post.tags),
      likes: post.likes,
      comments: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      user: serializeUser(post.user),
    }));
}

export async function getTrendingTags(limit = 10) {
  const posts = await prisma.post.findMany({
    select: { tags: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of parseJsonArray(post.tags)) {
      const key = tag.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

export async function getListings() {
  const listings = await prisma.marketplaceListing.findMany({
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });

  return listings.map((l) => ({
    id: l.id,
    sellerId: l.sellerId,
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category as "vehicle" | "parts" | "wheels" | "accessories" | "trade",
    condition: l.condition as "new" | "like-new" | "good" | "fair" | "project",
    image: l.image,
    images: serializeImagesField(l.images, l.image),
    location: l.location,
    createdAt: l.createdAt.toISOString(),
    tradeAccepted: l.tradeAccepted,
    seller: serializeUser(l.seller),
  }));
}

export async function getBookmarkedPosts(userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, targetType: "post" },
    orderBy: { createdAt: "desc" },
    select: { targetId: true },
  });

  const ids = bookmarks.map((b) => b.targetId);
  if (ids.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: { id: { in: ids } },
    include: { user: true },
  });

  const order = new Map(ids.map((id, index) => [id, index]));
  return posts
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((post) => ({
      id: post.id,
      userId: post.userId,
      image: post.image,
      images: serializeImagesField(post.images, post.image),
      caption: post.caption,
      tags: parseJsonArray(post.tags),
      likes: post.likes,
      comments: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      user: serializeUser(post.user),
    }));
}

export async function getBookmarkedListings(userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, targetType: "listing" },
    orderBy: { createdAt: "desc" },
    select: { targetId: true },
  });

  const ids = bookmarks.map((b) => b.targetId);
  if (ids.length === 0) return [];

  const listings = await prisma.marketplaceListing.findMany({
    where: { id: { in: ids } },
    include: { seller: true },
  });

  const order = new Map(ids.map((id, index) => [id, index]));
  return listings
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((l) => ({
      id: l.id,
      sellerId: l.sellerId,
      title: l.title,
      description: l.description,
      price: l.price,
      category: l.category as "vehicle" | "parts" | "wheels" | "accessories" | "trade",
      condition: l.condition as "new" | "like-new" | "good" | "fair" | "project",
      image: l.image,
      images: serializeImagesField(l.images, l.image),
      location: l.location,
      createdAt: l.createdAt.toISOString(),
      tradeAccepted: l.tradeAccepted,
      seller: serializeUser(l.seller),
    }));
}

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  return user ? serializeUser(user) : null;
}

export async function getFollowers(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: true },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => serializeUser(f.follower));
}

export async function getFollowing(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: true },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => serializeUser(f.following));
}

export async function getFollowingIds(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return follows.map((f) => f.followingId);
}

export async function getSuggestedUsers(userId?: string, excludeIds: string[] = [], limit = 5) {
  const exclude = [...new Set([...excludeIds, ...(userId ? [userId] : [])])];

  const users = await prisma.user.findMany({
    where: exclude.length ? { id: { notIn: exclude } } : {},
    orderBy: [{ posts: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit,
  });

  return users.map(serializeUser);
}

export async function getUserVehicles(userId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    include: { mods: true, buildLogs: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return vehicles.map(serializeVehicle);
}

export async function getUserPosts(userId: string) {
  const posts = await prisma.post.findMany({
    where: { userId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return posts.map((post) => ({
    id: post.id,
    userId: post.userId,
    image: post.image,
    images: serializeImagesField(post.images, post.image),
    caption: post.caption,
    tags: parseJsonArray(post.tags),
    likes: post.likes,
    comments: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    user: serializeUser(post.user),
  }));
}

export async function getLikedPostIds(userId: string) {
  const likes = await prisma.like.findMany({
    where: { userId, targetType: "post" },
    select: { targetId: true },
  });
  return likes.map((l) => l.targetId);
}

export async function searchPosts(query: string) {
  const q = query.trim();
  if (!q) return [];

  const posts = await prisma.post.findMany({
    where: {
      OR: [{ caption: { contains: q, mode: "insensitive" } }, { tags: { contains: q, mode: "insensitive" } }],
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return posts.map((post) => ({
    id: post.id,
    userId: post.userId,
    image: post.image,
    images: serializeImagesField(post.images, post.image),
    caption: post.caption,
    tags: parseJsonArray(post.tags),
    likes: post.likes,
    comments: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    user: serializeUser(post.user),
  }));
}

export async function searchVehicles(query: string) {
  const q = query.trim();
  if (!q) return [];

  const vehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { make: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { trim: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { mods: true, buildLogs: { orderBy: { createdAt: "desc" } }, user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return vehicles.map((vehicle) => ({
    ...serializeVehicle(vehicle),
    owner: serializeUser(vehicle.user),
  }));
}

export async function searchListings(query: string) {
  const q = query.trim();
  if (!q) return [];

  const listings = await prisma.marketplaceListing.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { seller: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return listings.map((l) => ({
    id: l.id,
    sellerId: l.sellerId,
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category as "vehicle" | "parts" | "wheels" | "accessories" | "trade",
    condition: l.condition as "new" | "like-new" | "good" | "fair" | "project",
    image: l.image,
    images: serializeImagesField(l.images, l.image),
    location: l.location,
    createdAt: l.createdAt.toISOString(),
    tradeAccepted: l.tradeAccepted,
    seller: serializeUser(l.seller),
  }));
}

export async function getMaintenanceLogs(userId: string) {
  const logs = await prisma.maintenanceLog.findMany({
    where: { userId },
    include: { vehicle: true },
    orderBy: { performedAt: "desc" },
  });

  return logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    vehicleId: log.vehicleId,
    title: log.title,
    description: log.description,
    mileage: log.mileage,
    cost: log.cost ?? undefined,
    performedAt: log.performedAt.toISOString(),
    category: log.category,
    vehicle: serializeVehicle(log.vehicle),
  }));
}

export async function getServiceManuals() {
  const manuals = await prisma.serviceManual.findMany({ orderBy: { title: "asc" } });
  return manuals.map((m) => ({
    id: m.id,
    vehicleMake: m.vehicleMake,
    vehicleModel: m.vehicleModel,
    yearRange: m.yearRange,
    title: m.title,
    sections: parseJsonArray(m.sections),
  }));
}

export async function getConversations(userId: string) {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { sentAt: "desc" }, take: 1 },
          participants: { include: { user: true } },
        },
      },
    },
  });

  return participations.map(({ conversation, lastReadAt }) => {
    const other = conversation.participants.find((p) => p.userId !== userId)?.user;
    const lastMessage = conversation.messages[0];
    const unread = lastMessage && lastMessage.senderId !== userId && (!lastReadAt || lastReadAt < lastMessage.sentAt) ? 1 : 0;

    return {
      id: conversation.id,
      participantIds: conversation.participants.map((p) => p.userId),
      lastMessage: lastMessage?.content ?? "",
      lastMessageAt: lastMessage?.sentAt.toISOString() ?? conversation.createdAt.toISOString(),
      unread,
      otherUser: other ? serializeUser(other) : null,
    };
  });
}

export async function getConversationMessages(conversationId: string) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: true },
    orderBy: { sentAt: "asc" },
  });

  return messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    content: m.content,
    sentAt: m.sentAt.toISOString(),
    sender: serializeUser(m.sender),
  }));
}

function serializeUser(user: {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  interests: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
    bio: user.bio ?? "",
    location: user.location ?? "",
    interests: parseJsonArray(user.interests),
    joinedAt: user.createdAt.toISOString().split("T")[0],
  };
}

function serializeVehicle(vehicle: {
  id: string;
  userId: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  image: string | null;
  mods?: { id: string; name: string; category: string; installedAt: Date; notes: string | null }[];
  buildLogs?: { id: string; vehicleId: string; title: string; content: string; image: string | null; images: string; createdAt: Date }[];
}) {
  return {
    id: vehicle.id,
    userId: vehicle.userId,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim ?? undefined,
    color: vehicle.color ?? "",
    image: vehicle.image ?? "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop",
    mods: (vehicle.mods ?? []).map((mod) => ({
      id: mod.id,
      name: mod.name,
      category: mod.category,
      installedAt: mod.installedAt.toISOString().split("T")[0],
      notes: mod.notes ?? undefined,
    })),
    buildLogs: (vehicle.buildLogs ?? []).map((log) => ({
      id: log.id,
      vehicleId: log.vehicleId,
      title: log.title,
      content: log.content,
      image: log.image ?? undefined,
      images: serializeImagesField(log.images, log.image ?? ""),
      createdAt: log.createdAt.toISOString().split("T")[0],
    })),
  };
}

export { serializeUser, serializeVehicle };
