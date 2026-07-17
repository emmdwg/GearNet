import { prisma } from "./prisma";
import type { MarketplaceCategoryId } from "./marketplace-categories";
import type { PostType } from "./types";
import { parseJsonArray } from "./api-helpers";
import { parseRouteStops } from "./route-stops";
import { getBlockedUserIds } from "./blocking";
import { canManageClubJoinRequests, clubRoleRank, normalizeClubRole } from "./club-roles";
import { serializeImagesField, serializePostMediaFields, getPostReactionSummaries } from "./social";
import { formatDynoHighlight, sumInstalledModCosts } from "./vehicle-meta";
import { VEHICLE_PLATFORMS } from "./manual-catalog/platforms";
import { inferCityFromLocation, normalizeCity } from "./city";
import { boostSortKey, isBoosted, isProActive } from "./platform";
import { messagePreview } from "./chat-content";
import { publicListingCoords } from "./geo-privacy";
import { filterItemsByDiscoverableAuthor } from "./privacy";
import { isRsvpStatus, type RsvpStatus } from "./rsvp-status";

export type FeedFilter = "all" | "photos" | "builds" | "for-sale";

const postInclude = {
  user: true,
  vehicle: {
    include: {
      buildLogs: { orderBy: { createdAt: "desc" as const }, take: 8 },
      listings: { select: { id: true }, take: 1 },
    },
  },
};

export async function getHiddenPostIds(userId: string) {
  const rows = await prisma.hiddenPost.findMany({
    where: { userId },
    select: { postId: true },
  });
  return rows.map((r) => r.postId);
}

export async function getMutedUserIds(userId: string) {
  const rows = await prisma.mutedUser.findMany({
    where: { userId },
    select: { mutedUserId: true },
  });
  return rows.map((r) => r.mutedUserId);
}

export async function getBuildOfWeek(viewerId?: string | null) {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  async function pick(where: { status: "published"; clubId: null; createdAt?: { gte: Date } }) {
    const posts = await prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: [{ likes: "desc" }, { commentCount: "desc" }, { createdAt: "desc" }],
      take: 12,
    });
    const visible = await filterItemsByDiscoverableAuthor(posts, viewerId);
    return visible[0] ?? null;
  }

  const recent = await pick({ status: "published", clubId: null, createdAt: { gte: since } });
  const allTime = recent ? null : await pick({ status: "published", clubId: null });
  const post = recent ?? allTime;
  if (!post) return null;

  const reactionMap = await getPostReactionSummaries([post.id]);
  const reactions = reactionMap.get(post.id);
  return {
    ...mapSerializedPost(post),
    reactionCounts: reactions?.reactionCounts ?? {},
    userReaction: reactions?.userReaction ?? null,
  };
}

export async function getPosts(
  viewerId?: string,
  options?: { filter?: FeedFilter; viewerLat?: number; viewerLng?: number }
) {
  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];
  const mutedIds = viewerId ? await getMutedUserIds(viewerId) : [];
  const excludedAuthorIds = [...new Set([...blockedIds, ...mutedIds])];
  const hiddenIds = viewerId ? await getHiddenPostIds(viewerId) : [];
  let posts = await prisma.post.findMany({
    where: {
      clubId: null,
      status: "published",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      ...(excludedAuthorIds.length ? { userId: { notIn: excludedAuthorIds } } : {}),
      ...(hiddenIds.length ? { id: { notIn: hiddenIds } } : {}),
    },
    include: postInclude,
    orderBy: { createdAt: "desc" },
  });

  posts = await filterItemsByDiscoverableAuthor(posts, viewerId);

  const filter = options?.filter ?? "all";
  if (filter === "photos") {
    posts = posts.filter((p) => (p.mediaType ?? "image") === "image");
  } else if (filter === "builds") {
    posts = posts.filter((p) => p.postType === "build");
  } else if (filter === "for-sale") {
    posts = posts.filter((p) => (p.vehicle?.listings?.length ?? 0) > 0);
  }

  const reactionMap = await getPostReactionSummaries(
    posts.map((p) => p.id),
    viewerId,
  );

  const collaboratorUsernames = [
    ...new Set(
      posts.flatMap((p) =>
        parseJsonArray(p.collaborators ?? "[]")
          .map((c) => c.replace(/^@/, "").trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  ];
  const collaboratorRows =
    collaboratorUsernames.length > 0
      ? await prisma.user.findMany({
          where: { username: { in: collaboratorUsernames, mode: "insensitive" } },
          select: { username: true, displayName: true, avatar: true },
        })
      : [];
  const collaboratorMap = new Map(
    collaboratorRows.map((u) => [u.username.toLowerCase(), u]),
  );

  const mapped = posts.map((post) => {
    const reactions = reactionMap.get(post.id);
    const collabNames = parseJsonArray(post.collaborators ?? "[]");
    const collaboratorUsers = collabNames
      .map((name) => {
        const key = name.replace(/^@/, "").trim().toLowerCase();
        const user = collaboratorMap.get(key);
        return user
          ? { username: user.username, displayName: user.displayName, avatar: user.avatar ?? undefined }
          : { username: name.replace(/^@/, "").trim() };
      })
      .filter((u) => u.username);
    return {
      ...mapSerializedPost(post),
      collaboratorUsers,
      reactionCounts: reactions?.reactionCounts ?? {},
      userReaction: reactions?.userReaction ?? null,
    };
  });

  if (!viewerId) return mapped;

  const [viewerSettings, followingIds, viewer] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: viewerId } }),
    getFollowingIds(viewerId),
    prisma.user.findUnique({ where: { id: viewerId }, select: { location: true } }),
  ]);
  const followingSet = new Set(followingIds);
  const viewerScenes = parseJsonArray(viewerSettings?.sceneTags ?? "[]");
  const nearRadius = viewerSettings?.nearYouRadius ?? 50;
  const viewerLat = options?.viewerLat;
  const viewerLng = options?.viewerLng;
  const viewerCity = viewer?.location?.toLowerCase().trim() ?? "";

  const authorSettings =
    viewerScenes.length > 0
      ? await prisma.userSettings.findMany({
          where: { userId: { in: posts.map((p) => p.userId) } },
          select: { userId: true, sceneTags: true },
        })
      : [];
  const authorSceneMap = new Map(
    authorSettings.map((s) => [s.userId, parseJsonArray(s.sceneTags ?? "[]")])
  );

  function rankScore(post: (typeof mapped)[number]) {
    let score = 0;
    if (followingSet.has(post.userId)) score += 3;
    const authorScenes = authorSceneMap.get(post.userId) ?? post.user?.sceneTags ?? [];
    score += viewerScenes.filter((tag) => authorScenes.includes(tag)).length * 2;
    if (viewerLat != null && viewerLng != null && post.latitude != null && post.longitude != null) {
      const dist = haversineKm(viewerLat, viewerLng, post.latitude, post.longitude);
      if (dist <= nearRadius) score += Math.max(1, 3 - Math.floor(dist / (nearRadius / 3)));
    } else if (viewerCity && post.user?.location?.toLowerCase().includes(viewerCity.split(",")[0])) {
      score += 1;
    }
    return score;
  }

  return [...mapped].sort((a, b) => {
    const aScore = rankScore(a);
    const bScore = rankScore(b);
    if (aScore !== bScore) return bScore - aScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getUserDrafts(userId: string) {
  const posts = await prisma.post.findMany({
    where: { userId, status: "draft" },
    include: postInclude,
    orderBy: { createdAt: "desc" },
  });
  return posts.map(mapSerializedPost);
}

export async function getUserScheduledPosts(userId: string) {
  const posts = await prisma.post.findMany({
    where: { userId, status: "scheduled" },
    include: postInclude,
    orderBy: { scheduledAt: "asc" },
  });
  return posts.map(mapSerializedPost);
}

export async function getPitUpdates(viewerId?: string) {
  const now = new Date();
  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];
  const updates = await prisma.pitUpdate.findMany({
    where: {
      expiresAt: { gt: now },
      ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const followingIds = viewerId
    ? new Set(
        (
          await prisma.follow.findMany({
            where: { followerId: viewerId },
            select: { followingId: true },
          })
        ).map((f) => f.followingId),
      )
    : new Set<string>();

  const { getCrewOwnerIdsForViewer, filterPitUpdatesForViewer } = await import("@/lib/crew");
  const crewOwnerIds = viewerId ? await getCrewOwnerIdsForViewer(viewerId) : new Set<string>();
  const visible = filterPitUpdatesForViewer(updates, viewerId, followingIds, crewOwnerIds);

  return visible.map((u) => {
    let slides: { image: string; caption?: string }[] = [];
    try {
      const parsed = JSON.parse(u.slides || "[]");
      if (Array.isArray(parsed)) slides = parsed.filter((s) => s && typeof s.image === "string");
    } catch {
      slides = [];
    }
    return {
      id: u.id,
      userId: u.userId,
      image: u.image,
      slides: slides.length > 0 ? slides : [{ image: u.image, caption: u.caption }],
      caption: u.caption,
    visibility: u.visibility as "public" | "followers" | "crew" | "private",
    latitude: u.latitude ?? undefined,
    longitude: u.longitude ?? undefined,
    createdAt: u.createdAt.toISOString(),
    expiresAt: u.expiresAt.toISOString(),
    likes: u.likes,
    comments: u.commentCount,
    user: serializeUser(u.user),
  };
  });
}

export async function getUserCollections(userId: string) {
  const collections = await prisma.postCollection.findMany({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          post: { select: { id: true, image: true, images: true } },
        },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    createdAt: c.createdAt.toISOString(),
    count: c._count.items,
    thumbnails: c.items
      .map((item) => {
        const imgs = serializeImagesField(item.post.images, item.post.image);
        return imgs[0] ?? item.post.image;
      })
      .filter(Boolean),
  }));
}

export async function getCollectionPosts(userId: string, collectionId: string) {
  const collection = await prisma.postCollection.findFirst({
    where: { id: collectionId, userId },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: { post: { include: postInclude } },
      },
    },
  });

  if (!collection) return null;

  const posts = collection.items.map((item) => item.post).filter((p) => p.status === "published");
  const reactionMap = await getPostReactionSummaries(posts.map((p) => p.id), userId);

  return {
    id: collection.id,
    name: collection.name,
    createdAt: collection.createdAt.toISOString(),
    posts: posts.map((post) => {
      const reactions = reactionMap.get(post.id);
      return {
        ...mapSerializedPost(post),
        reactionCounts: reactions?.reactionCounts ?? {},
        userReaction: reactions?.userReaction ?? null,
      };
    }),
  };
}

export async function getEvents(clubId?: string, viewerId?: string) {
  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];
  const events = await prisma.event.findMany({
    where: {
      ...(clubId ? { clubId } : {}),
      ...(blockedIds.length ? { organizerId: { notIn: blockedIds } } : {}),
    },
    include: {
      organizer: true,
      club: { select: { id: true, slug: true, name: true, image: true, isPublic: true } },
    },
    orderBy: { date: "asc" },
  });

  let memberClubIds = new Set<string>();
  let rsvpByEventId = new Map<string, string>();
  if (viewerId) {
    const memberships = await prisma.clubMember.findMany({
      where: { userId: viewerId },
      select: { clubId: true },
    });
    memberClubIds = new Set(memberships.map((m) => m.clubId));

    const rsvps = await prisma.eventRsvp.findMany({
      where: { userId: viewerId },
      select: { eventId: true, rsvpStatus: true },
    });
    rsvpByEventId = new Map(rsvps.map((r) => [r.eventId, r.rsvpStatus]));
  }

  const visible = events.filter((event) => {
    if (!event.clubId || !event.club) return true;
    if (event.club.isPublic) return true;
    return viewerId ? memberClubIds.has(event.clubId) : false;
  });

  return visible
    .sort((a, b) => {
      const boostDiff = boostSortKey(b.boostedUntil) - boostSortKey(a.boostedUntil);
      if (boostDiff !== 0) return boostDiff;
      return a.date.getTime() - b.date.getTime();
    })
    .map((event) => {
      const raw = rsvpByEventId.get(event.id) ?? null;
      const viewerRsvpStatus: RsvpStatus | null = raw && isRsvpStatus(raw) ? raw : null;
      return {
        ...serializeEvent(event),
        viewerRsvpStatus,
      };
    });
}

export async function getEventById(id: string, viewerId?: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: true,
      club: { select: { id: true, slug: true, name: true, image: true, isPublic: true } },
    },
  });
  if (!event) return null;

  if (viewerId) {
    const blockedIds = await getBlockedUserIds(viewerId);
    if (blockedIds.includes(event.organizerId)) return null;
  }

  if (event.clubId && event.club && !event.club.isPublic) {
    if (!viewerId) return null;
    const member = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: event.clubId, userId: viewerId } },
    });
    if (!member) return null;
  }

  return serializeEvent(event);
}

export async function getClubs(viewerId?: string) {
  let memberships = new Map<string, string>();
  let joinedIds = new Set<string>();
  let pendingRequestClubIds = new Set<string>();
  let ownedPendingCounts = new Map<string, number>();

  if (viewerId) {
    const memberRows = await prisma.clubMember.findMany({
      where: { userId: viewerId },
      select: { clubId: true, role: true },
    });
    memberships = new Map(memberRows.map((m) => [m.clubId, m.role]));
    joinedIds = new Set(memberRows.map((m) => m.clubId));

    const pendingRows = await prisma.clubJoinRequest.findMany({
      where: { userId: viewerId, status: "pending" },
      select: { clubId: true },
    });
    pendingRequestClubIds = new Set(pendingRows.map((r) => r.clubId));

    const manageClubIds = memberRows
      .filter((m) => canManageClubJoinRequests(m.role, false))
      .map((m) => m.clubId);
    const ownedClubs = await prisma.club.findMany({
      where: { ownerId: viewerId },
      select: { id: true },
    });
    const pendingScopeIds = [...new Set([...ownedClubs.map((c) => c.id), ...manageClubIds])];
    if (pendingScopeIds.length > 0) {
      const counts = await prisma.clubJoinRequest.groupBy({
        by: ["clubId"],
        where: {
          clubId: { in: pendingScopeIds },
          status: "pending",
        },
        _count: { _all: true },
      });
      ownedPendingCounts = new Map(counts.map((c) => [c.clubId, c._count._all]));
    }
  }

  const publicClubs = await prisma.club.findMany({
    where: { isPublic: true },
    include: { owner: true },
    orderBy: [{ memberCount: "desc" }, { createdAt: "desc" }],
  });

  let privateJoined: typeof publicClubs = [];
  if (viewerId && joinedIds.size > 0) {
    privateJoined = await prisma.club.findMany({
      where: { isPublic: false, id: { in: [...joinedIds] } },
      include: { owner: true },
      orderBy: [{ memberCount: "desc" }, { createdAt: "desc" }],
    });
  }

  const byId = new Map<string, (typeof publicClubs)[number]>();
  for (const club of [...publicClubs, ...privateJoined]) {
    byId.set(club.id, club);
  }

  return [...byId.values()].map((club) =>
    serializeClub(
      club,
      joinedIds.has(club.id),
      memberships.get(club.id) ?? null,
      pendingRequestClubIds.has(club.id),
      ownedPendingCounts.get(club.id) ?? 0
    )
  );
}

export async function getClubBySlug(slug: string, viewerId?: string) {
  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      owner: true,
      parentClub: { select: { id: true, slug: true, name: true, city: true } },
      chapters: {
        where: viewerId
          ? {
              OR: [
                { isPublic: true },
                { ownerId: viewerId },
                { members: { some: { userId: viewerId } } },
              ],
            }
          : { isPublic: true },
        select: { id: true, slug: true, name: true, city: true, memberCount: true, image: true },
        orderBy: { name: "asc" },
      },
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
        take: 48,
      },
    },
  });
  if (!club) return null;

  let role: string | null = null;
  let joined = false;
  let joinRequestPending = false;
  let pendingRequestCount = 0;

  if (viewerId) {
    const isOwner = club.ownerId === viewerId;
    let member = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: club.id, userId: viewerId } },
    });

    // Self-heal: owners should always have a membership row so they can manage the club.
    if (isOwner && !member) {
      member = await prisma.clubMember.upsert({
        where: { clubId_userId: { clubId: club.id, userId: viewerId } },
        create: { clubId: club.id, userId: viewerId, role: "owner" },
        update: { role: "owner" },
      });
      await prisma.club.update({
        where: { id: club.id },
        data: { memberCount: { increment: 1 } },
      });
    }

    if (member) {
      joined = true;
      role = member.role;
    } else {
      const request = await prisma.clubJoinRequest.findUnique({
        where: { clubId_userId: { clubId: club.id, userId: viewerId } },
      });
      joinRequestPending = request?.status === "pending";
    }

    if (canManageClubJoinRequests(member?.role, isOwner)) {
      pendingRequestCount = await prisma.clubJoinRequest.count({
        where: { clubId: club.id, status: "pending" },
      });
    }
  }

  // Private or approval-gated: non-members get a limited preview so they can request/join.
  // Owners always get full access even if membership was missing before self-heal.
  const needsPreview =
    (!club.isPublic || Boolean(club.requiresApproval)) &&
    !joined &&
    club.ownerId !== viewerId;
  if (needsPreview) {
    return {
      ...serializeClub(club, false, null, joinRequestPending, 0),
      access: "preview" as const,
      parentClub: null,
      chapters: [],
      members: [],
      events: [],
      posts: [],
    };
  }

  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];
  const events = await getEvents(club.id, viewerId);
  const posts = await getClubPosts(club.id, 24, viewerId);
  const members = club.members
    .filter((m) => !blockedIds.includes(m.userId))
    .map((m) => {
      const memberRole =
        m.userId === club.ownerId ? "owner" : normalizeClubRole(m.role);
      return {
        id: m.id,
        userId: m.userId,
        role: memberRole,
        joinedAt: m.joinedAt.toISOString(),
        user: serializeUser(m.user),
      };
    })
    .sort((a, b) => {
      const rankDiff = clubRoleRank(b.role) - clubRoleRank(a.role);
      if (rankDiff !== 0) return rankDiff;
      return a.user.displayName.localeCompare(b.user.displayName);
    });

  return {
    ...serializeClub(
      club,
      joined,
      role ? normalizeClubRole(role) : role,
      joinRequestPending,
      pendingRequestCount,
    ),
    access: "full" as const,
    parentClub: club.parentClub,
    chapters: club.chapters,
    members,
    events,
    posts,
    memberListTruncated: club.memberCount > members.length,
  };
}

export async function getClubPosts(clubId: string, limit = 24, viewerId?: string | null) {
  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];
  const posts = await prisma.post.findMany({
    where: {
      clubId,
      status: "published",
      ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return posts.map(mapSerializedPost);
}

export async function getVehicleById(id: string, viewerId?: string | null) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      user: true,
      mods: { orderBy: { installedAt: "desc" } },
      buildLogs: { orderBy: { createdAt: "desc" } },
      posts: {
        where: { postType: "before-after", status: "published" },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          beforeImage: true,
          afterImage: true,
          image: true,
          caption: true,
        },
      },
    },
  });
  if (!vehicle) return null;

  const includeSensitive = Boolean(viewerId && viewerId === vehicle.userId);

  return {
    ...serializeVehicle(vehicle, { includeSensitive }),
    owner: serializeUser(vehicle.user),
    beforeAfterPosts: vehicle.posts.map((p) => ({
      id: p.id,
      beforeImage: p.beforeImage ?? p.image,
      afterImage: p.afterImage ?? p.image,
      caption: p.caption,
    })),
  };
}

export async function getVehicleByUsernameAndSlug(
  username: string,
  vehicleSlug: string,
  viewerId?: string | null,
) {
  const user = await getUserByUsername(username);
  if (!user) return null;
  const vehicle = await prisma.vehicle.findFirst({
    where: { userId: user.id, slug: vehicleSlug },
    select: { id: true },
  });
  if (!vehicle) return null;
  return getVehicleById(vehicle.id, viewerId);
}

export async function getMeetPins(viewerId?: string) {
  const now = new Date();
  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];
  const pins = await prisma.meetPin.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
    },
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
    pinType: pin.pinType,
    expiresAt: pin.expiresAt?.toISOString() ?? null,
    dynoHp: pin.dynoHp ?? null,
    createdAt: pin.createdAt.toISOString(),
    user: serializeUser(pin.user),
  }));
}

export async function searchUsers(query: string, viewerId?: string | null) {
  const q = query.trim().replace(/^@+/, "");
  if (!q) return [];

  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];

  const users = await prisma.user.findMany({
    where: {
      AND: [
        viewerId ? { id: { not: viewerId } } : {},
        blockedIds.length ? { id: { notIn: blockedIds } } : {},
        {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    include: { settings: { select: { profileVisibility: true, showLocation: true } } },
    take: 20,
  });

  const followingIds = viewerId
    ? new Set(
        (
          await prisma.follow.findMany({
            where: { followerId: viewerId, followingId: { in: users.map((u) => u.id) } },
            select: { followingId: true },
          })
        ).map((f) => f.followingId),
      )
    : new Set<string>();

  return users
    .map((user) => {
      const serialized = serializeUser(user);
      const visibility = user.settings?.profileVisibility ?? "public";
      const canSeeFull =
        visibility === "public" || (viewerId != null && followingIds.has(user.id));
      if (canSeeFull) {
        return {
          ...serialized,
          location: user.settings?.showLocation === false ? "" : serialized.location,
        };
      }
      return {
        ...serialized,
        bio: "",
        location: "",
        interests: [] as string[],
        coverImage: "",
      };
    })
    .slice(0, 10);
}

export async function getListingById(id: string) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: { seller: true },
  });
  if (!listing) return null;

  const coords = publicListingCoords(listing.latitude, listing.longitude);

  return {
    id: listing.id,
    sellerId: listing.sellerId,
    vehicleId: listing.vehicleId,
    modId: listing.modId ?? undefined,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    originalPrice: listing.originalPrice ?? undefined,
    category: listing.category as MarketplaceCategoryId,
    condition: listing.condition as "new" | "like-new" | "good" | "fair" | "project",
    image: listing.image,
    images: serializeImagesField(listing.images, listing.image),
    location: listing.location,
    fitmentTags: parseJsonArray(listing.fitmentTags),
    createdAt: listing.createdAt.toISOString(),
    tradeAccepted: listing.tradeAccepted,
    partNumber: listing.partNumber ?? undefined,
    soldAt: listing.soldAt?.toISOString() ?? null,
    soldPrice: listing.soldPrice ?? undefined,
    latitude: coords.latitude,
    longitude: coords.longitude,
    isBundle: listing.isBundle,
    seller: serializeUser(listing.seller),
    sellerVerified: listing.seller.verifiedSeller,
    sellerVerifiedShop: listing.seller.isVerifiedShop,
    boostedUntil: listing.boostedUntil?.toISOString() ?? null,
    featured: isBoosted(listing.boostedUntil),
  };
}

export async function getPostsByTag(tag: string, viewerId?: string | null) {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return [];

  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];

  const posts = await prisma.post.findMany({
    where: {
      clubId: null,
      status: "published",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      tags: { contains: normalized, mode: "insensitive" },
      ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  const matched = posts.filter((post) =>
    parseJsonArray(post.tags).some((t) => t.toLowerCase() === normalized),
  );
  const visible = await filterItemsByDiscoverableAuthor(matched, viewerId);
  return visible.map(mapSerializedPost);
}

export async function getTrendingTags(limit = 10) {
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
      clubId: null,
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
    },
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

export async function getListings(viewerId?: string) {
  const [listings, blockedIds] = await Promise.all([
    prisma.marketplaceListing.findMany({
      include: { seller: true },
      orderBy: { createdAt: "desc" },
    }),
    viewerId ? getBlockedUserIds(viewerId) : Promise.resolve([] as string[]),
  ]);
  const blocked = new Set(blockedIds);

  return listings
    .filter((l) => !viewerId || !blocked.has(l.sellerId))
    .sort((a, b) => {
      const boostDiff = boostSortKey(b.boostedUntil) - boostSortKey(a.boostedUntil);
      if (boostDiff !== 0) return boostDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .map((l) => {
      const coords = publicListingCoords(l.latitude, l.longitude);
      return {
        id: l.id,
        sellerId: l.sellerId,
        vehicleId: l.vehicleId,
        modId: l.modId ?? undefined,
        title: l.title,
        description: l.description,
        price: l.price,
        originalPrice: l.originalPrice ?? undefined,
        category: l.category as MarketplaceCategoryId,
        condition: l.condition as "new" | "like-new" | "good" | "fair" | "project",
        image: l.image,
        images: serializeImagesField(l.images, l.image),
        location: l.location,
        fitmentTags: parseJsonArray(l.fitmentTags),
        createdAt: l.createdAt.toISOString(),
        tradeAccepted: l.tradeAccepted,
        partNumber: l.partNumber ?? undefined,
        soldAt: l.soldAt?.toISOString() ?? null,
        soldPrice: l.soldPrice ?? undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
        isBundle: l.isBundle,
        boostedUntil: l.boostedUntil?.toISOString() ?? null,
        featured: isBoosted(l.boostedUntil),
        seller: serializeUser(l.seller),
      };
    });
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
    .map(mapSerializedPost);
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
    .map((l) => {
      const coords = publicListingCoords(l.latitude, l.longitude);
      return {
      id: l.id,
      sellerId: l.sellerId,
      title: l.title,
      description: l.description,
      price: l.price,
      category: l.category as MarketplaceCategoryId,
      condition: l.condition as "new" | "like-new" | "good" | "fair" | "project",
      image: l.image,
      images: serializeImagesField(l.images, l.image),
      location: l.location,
      createdAt: l.createdAt.toISOString(),
      tradeAccepted: l.tradeAccepted,
      partNumber: l.partNumber ?? undefined,
      soldAt: l.soldAt?.toISOString() ?? null,
      soldPrice: l.soldPrice ?? undefined,
      latitude: coords.latitude,
      longitude: coords.longitude,
      isBundle: l.isBundle,
      seller: serializeUser(l.seller),
    };
    });
}

export async function getUserByUsername(username: string) {
  const raw = decodeURIComponent(username ?? "").trim();
  if (!raw) return null;

  const normalized = raw.toLowerCase();

  // Prefer exact canonical match (lowercase, trimmed).
  let user = await prisma.user.findUnique({ where: { username: normalized } });
  if (user) return serializeUser(user);

  // Legacy accounts may have mixed case or accidental whitespace.
  const candidates = await prisma.user.findMany({
    where: {
      OR: [
        { username: { equals: raw, mode: "insensitive" } },
        { username: { equals: normalized, mode: "insensitive" } },
        { username: { contains: normalized, mode: "insensitive" } },
      ],
    },
    take: 25,
  });

  user =
    candidates.find((candidate) => candidate.username.trim().toLowerCase() === normalized) ?? null;

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
  const blockedIds = userId ? await getBlockedUserIds(userId) : [];
  const exclude = [...new Set([...excludeIds, ...blockedIds, ...(userId ? [userId] : [])])];

  const users = await prisma.user.findMany({
    where: exclude.length ? { id: { notIn: exclude } } : {},
    include: { settings: { select: { profileVisibility: true } } },
    orderBy: [{ posts: { _count: "desc" } }, { createdAt: "desc" }],
    take: Math.max(limit * 4, 20),
  });

  return users
    .filter((u) => (u.settings?.profileVisibility ?? "public") === "public")
    .slice(0, limit)
    .map(serializeUser);
}

function resolveVehiclePlatform(make: string, model: string, year: number): string {
  for (const platform of VEHICLE_PLATFORMS) {
    if (platform.make !== make || platform.model !== model) continue;
    for (const span of platform.spans) {
      if (year >= span.start && year <= span.end) return `${platform.make} ${platform.model}`;
    }
  }
  return make;
}

export async function getBuildersLikeYou(userId: string, limit = 8) {
  const [user, followingIds, blockedIds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { sceneTags: true, vehicles: { select: { make: true, model: true, year: true } } },
    }),
    getFollowingIds(userId),
    getBlockedUserIds(userId),
  ]);
  if (!user) return [];

  const myScenes = new Set(parseJsonArray(user.sceneTags ?? "[]"));
  const myMakes = new Set(user.vehicles.map((v) => v.make));
  const myPlatforms = new Set(
    user.vehicles.map((v) => resolveVehiclePlatform(v.make, v.model, v.year))
  );

  const exclude = [...new Set([userId, ...followingIds, ...blockedIds])];

  const candidates = await prisma.user.findMany({
    where: { id: { notIn: exclude } },
    include: {
      vehicles: { select: { make: true, model: true, year: true } },
      settings: { select: { showGarage: true, profileVisibility: true } },
    },
    take: 200,
    orderBy: { posts: { _count: "desc" } },
  });

  type Scored = ReturnType<typeof serializeUser> & { score: number; matchReason: string };
  const scored: Scored[] = [];

  for (const candidate of candidates) {
    const visibility = candidate.settings?.profileVisibility ?? "public";
    const showGarage = candidate.settings?.showGarage ?? true;
    if (visibility !== "public" || !showGarage) continue;

    const theirScenes = parseJsonArray(candidate.sceneTags ?? "[]");
    const sceneOverlap = theirScenes.filter((t) => myScenes.has(t));
    const sharedMakes = candidate.vehicles.filter((v) => myMakes.has(v.make));
    const sharedPlatforms = candidate.vehicles.filter((v) =>
      myPlatforms.has(resolveVehiclePlatform(v.make, v.model, v.year))
    );

    let score = 0;
    const reasons: string[] = [];
    if (sceneOverlap.length > 0) {
      score += sceneOverlap.length * 3;
      reasons.push(sceneOverlap[0]);
    }
    if (sharedPlatforms.length > 0) {
      score += sharedPlatforms.length * 4;
      const v = sharedPlatforms[0];
      reasons.push(`${v.year} ${v.make} ${v.model}`);
    } else if (sharedMakes.length > 0) {
      score += sharedMakes.length * 2;
      reasons.push(sharedMakes[0].make);
    }

    if (score === 0) continue;
    scored.push({
      ...serializeUser(candidate),
      score,
      matchReason: reasons[0] ?? "Similar builder",
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.min(10, Math.max(6, limit))).map(({ score: _s, matchReason, ...u }) => ({
    ...u,
    matchReason,
  }));
}

export async function getLocalHero(city: string, viewerId?: string | null) {
  const normalized = normalizeCity(city);
  if (!normalized) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];

  const usersInCity = await prisma.user.findMany({
    where: {
      location: { contains: city.trim(), mode: "insensitive" },
      ...(blockedIds.length ? { id: { notIn: blockedIds } } : {}),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      location: true,
      settings: { select: { profileVisibility: true, showLocation: true } },
    },
  });

  const eligible = usersInCity.filter((u) => {
    const visibility = u.settings?.profileVisibility ?? "public";
    const showLocation = u.settings?.showLocation ?? true;
    return visibility === "public" && showLocation;
  });

  if (eligible.length === 0) return null;

  const counts = await prisma.post.groupBy({
    by: ["userId"],
    where: {
      userId: { in: eligible.map((u) => u.id) },
      createdAt: { gte: thirtyDaysAgo },
      status: "published",
    },
    _count: { id: true },
  });

  if (counts.length === 0) return null;

  const countMap = new Map(counts.map((c) => [c.userId, c._count.id]));
  let best = eligible[0];
  let bestCount = countMap.get(best.id) ?? 0;

  for (const u of eligible) {
    const c = countMap.get(u.id) ?? 0;
    if (c > bestCount) {
      best = u;
      bestCount = c;
    }
  }

  if (bestCount === 0) return null;

  return {
    id: best.id,
    username: best.username,
    displayName: best.displayName,
    avatar: best.avatar ?? "",
    city: city.trim(),
    postCount: bestCount,
  };
}

export async function isLocalHero(userId: string, city: string | null): Promise<boolean> {
  if (!city) return false;
  const hero = await getLocalHero(city);
  return hero?.id === userId;
}

export async function getUserVehicles(userId: string, opts?: { includeSensitive?: boolean }) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    include: { mods: true, buildLogs: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return vehicles.map((vehicle) =>
    serializeVehicle(vehicle, { includeSensitive: opts?.includeSensitive }),
  );
}

export async function getUserPosts(userId: string, viewerId?: string) {
  const isOwner = viewerId === userId;
  const posts = await prisma.post.findMany({
    where: {
      userId,
      ...(isOwner ? {} : { status: "published" }),
    },
    include: postInclude,
    orderBy: { createdAt: "desc" },
  });

  return posts.map(mapSerializedPost);
}

export async function getLikedPostIds(userId: string) {
  const likes = await prisma.like.findMany({
    where: { userId, targetType: "post" },
    select: { targetId: true },
  });
  return likes.map((l) => l.targetId);
}

export async function getBookmarkedPostIds(userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, targetType: "post" },
    select: { targetId: true },
  });
  return bookmarks.map((b) => b.targetId);
}

export async function searchPosts(query: string, viewerId?: string | null) {
  const q = query.trim();
  if (!q) return [];

  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];

  const posts = await prisma.post.findMany({
    where: {
      clubId: null,
      status: "published",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      AND: [
        {
          OR: [
            { caption: { contains: q, mode: "insensitive" } },
            { tags: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
      ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const visible = await filterItemsByDiscoverableAuthor(posts, viewerId);
  return visible.slice(0, 20).map(mapSerializedPost);
}

export async function searchVehicles(query: string, viewerId?: string | null) {
  const q = query.trim();
  if (!q) return [];

  const [blockedIds, followingRows] = await Promise.all([
    viewerId ? getBlockedUserIds(viewerId) : Promise.resolve([] as string[]),
    viewerId
      ? prisma.follow.findMany({
          where: { followerId: viewerId },
          select: { followingId: true },
        })
      : Promise.resolve([] as { followingId: string }[]),
  ]);
  const followingIds = new Set(followingRows.map((f) => f.followingId));

  const vehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { make: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { trim: { contains: q, mode: "insensitive" } },
      ],
      ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
    },
    include: {
      mods: true,
      buildLogs: { orderBy: { createdAt: "desc" } },
      user: { include: { settings: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return vehicles
    .filter((vehicle) => {
      if (viewerId && vehicle.userId === viewerId) return true;
      const settings = vehicle.user.settings;
      const showGarage = settings?.showGarage ?? true;
      if (!showGarage) return false;
      const visibility = settings?.profileVisibility ?? "public";
      if (visibility === "private") return false;
      if (visibility === "followers") return followingIds.has(vehicle.userId);
      return true;
    })
    .slice(0, 20)
    .map((vehicle) => ({
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

  return listings.map((l) => {
    const coords = publicListingCoords(l.latitude, l.longitude);
    return {
    id: l.id,
    sellerId: l.sellerId,
    vehicleId: l.vehicleId,
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category as MarketplaceCategoryId,
    condition: l.condition as "new" | "like-new" | "good" | "fair" | "project",
    image: l.image,
    images: serializeImagesField(l.images, l.image),
    location: l.location,
    fitmentTags: parseJsonArray(l.fitmentTags),
    createdAt: l.createdAt.toISOString(),
    tradeAccepted: l.tradeAccepted,
    partNumber: l.partNumber ?? undefined,
    soldAt: l.soldAt?.toISOString() ?? null,
    soldPrice: l.soldPrice ?? undefined,
    latitude: coords.latitude,
    longitude: coords.longitude,
    isBundle: l.isBundle,
    seller: serializeUser(l.seller),
  };
  });
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
    receiptImage: log.receiptImage,
    shopName: log.shopName,
    serviceType: log.serviceType,
    reminderAt: log.reminderAt?.toISOString() ?? null,
    nextDueDate: log.nextDueDate?.toISOString() ?? null,
    nextDueMileage: log.nextDueMileage ?? undefined,
    difficulty: log.difficulty ?? undefined,
    vehicle: serializeVehicle(log.vehicle),
  }));
}

export async function getUserCheckInCount(userId: string) {
  return prisma.eventCheckIn.count({ where: { userId } });
}

export async function getServiceManuals(limit = 48) {
  const { getServiceManualsPayload } = await import("@/lib/manual-catalog/service");
  return getServiceManualsPayload(limit);
}

export async function getConversations(userId: string) {
  const [participations, blockedIds] = await Promise.all([
    prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { sentAt: "desc" }, take: 1 },
            participants: { include: { user: true } },
            club: { select: { id: true, slug: true, name: true, image: true } },
            event: { select: { id: true, title: true, image: true, date: true } },
          },
        },
      },
    }),
    getBlockedUserIds(userId),
  ]);
  const blocked = new Set(blockedIds);

  const filtered = participations.filter(({ conversation }) => {
    if (conversation.type !== "dm") return true;
    const other = conversation.participants.find((p) => p.userId !== userId);
    if (!other) return false;
    return !blocked.has(other.userId);
  });

  const unreadCounts = await Promise.all(
    filtered.map(({ conversation, lastReadAt }) =>
      prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          ...(lastReadAt ? { sentAt: { gt: lastReadAt } } : {}),
        },
      }),
    ),
  );

  const items = filtered.map(({ conversation, lastReadAt }, index) => {
    const isGroup = conversation.type === "club" || conversation.type === "event";
    const other = !isGroup
      ? conversation.participants.find((p) => p.userId !== userId)?.user
      : undefined;
    const lastMessage = conversation.messages[0];

    const groupName =
      conversation.name ??
      conversation.club?.name ??
      conversation.event?.title ??
      "Crew Chat";
    const groupImage = conversation.club?.image ?? conversation.event?.image ?? null;

    return {
      id: conversation.id,
      type: conversation.type,
      participantCount: conversation.participants.length,
      lastMessage: lastMessage ? messagePreview(lastMessage.content) : "",
      lastMessageAt: lastMessage?.sentAt.toISOString() ?? conversation.createdAt.toISOString(),
      unread: unreadCounts[index] ?? 0,
      otherUser: other ? serializeUser(other) : null,
      groupName: isGroup ? groupName : undefined,
      groupImage: isGroup ? groupImage : undefined,
      clubId: conversation.clubId ?? undefined,
      clubSlug: conversation.club?.slug,
      eventId: conversation.eventId ?? undefined,
      lastReadAt: lastReadAt?.toISOString() ?? null,
    };
  });

  return items.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
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

function mapSerializedPost(post: {
  id: string;
  userId: string;
  vehicleId?: string | null;
  postType?: string | null;
  image: string;
  images: string;
  mediaType?: string | null;
  videoUrl?: string | null;
  videoDuration?: number | null;
  videoPoster?: string | null;
  beforeImage?: string | null;
  afterImage?: string | null;
  inspiredByPostId?: string | null;
  collaborators?: string;
  audioUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  caption: string;
  tags: string;
  likes: number;
  commentCount: number;
  createdAt: Date;
  user: Parameters<typeof serializeUser>[0];
  vehicle?: {
    year: number;
    make: string;
    model: string;
    buildLogs?: { dynoHp?: number | null; lapTime?: string | null; trackName?: string | null }[];
    listings?: { id: string }[];
  } | null;
  status?: string | null;
  scheduledAt?: Date | null;
  isSponsored?: boolean | null;
  sponsorName?: string | null;
  sponsorUrl?: string | null;
}) {
  const dynoHighlight = formatDynoHighlight(post.vehicle?.buildLogs);
  const forSale = (post.vehicle?.listings?.length ?? 0) > 0;
  return {
    id: post.id,
    userId: post.userId,
    vehicleId: post.vehicleId ?? null,
    vehicleRef: post.vehicle ? `${post.vehicle.year} ${post.vehicle.make} ${post.vehicle.model}` : undefined,
    dynoHighlight,
    forSale,
    status: (post.status ?? "published") as "draft" | "published" | "scheduled",
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
    isSponsored: Boolean(post.isSponsored),
    sponsorName: post.sponsorName ?? null,
    sponsorUrl: post.sponsorUrl ?? null,
    postType: (post.postType ?? "standard") as PostType,
    beforeImage: post.beforeImage ?? null,
    afterImage: post.afterImage ?? null,
    inspiredByPostId: post.inspiredByPostId ?? null,
    collaborators: parseJsonArray(post.collaborators ?? "[]"),
    audioUrl: post.audioUrl ?? null,
    ...(() => {
      const fuzzed = publicListingCoords(post.latitude, post.longitude);
      return { latitude: fuzzed.latitude ?? null, longitude: fuzzed.longitude ?? null };
    })(),
    ...serializePostMediaFields(post),
    caption: post.caption,
    tags: parseJsonArray(post.tags),
    likes: post.likes,
    comments: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    user: serializeUser(post.user),
  };
}

function serializeUser(user: {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  coverImage?: string | null;
  bio: string | null;
  location: string | null;
  interests: string;
  primaryVehicleId?: string | null;
  buildStreak?: number;
  lastBuildActivityAt?: Date | null;
  maintenanceStreak?: number;
  lastMaintenanceAt?: Date | null;
  verifiedSeller?: boolean;
  isVerifiedShop?: boolean;
  isPro?: boolean;
  proExpiresAt?: Date | null;
  garageSlug?: string | null;
  sceneTags?: string;
  referralCount?: number;
  createdAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
    coverImage: user.coverImage ?? "",
    bio: user.bio ?? "",
    location: user.location ?? "",
    interests: parseJsonArray(user.interests),
    primaryVehicleId: user.primaryVehicleId ?? null,
    buildStreak: user.buildStreak ?? 0,
    lastBuildActivityAt: user.lastBuildActivityAt?.toISOString() ?? null,
    maintenanceStreak: user.maintenanceStreak ?? 0,
    lastMaintenanceAt: user.lastMaintenanceAt?.toISOString() ?? null,
    verifiedSeller: user.verifiedSeller ?? false,
    isVerifiedShop: user.isVerifiedShop ?? false,
    isPro: isProActive(user),
    proExpiresAt: user.proExpiresAt?.toISOString() ?? null,
    garageSlug: user.garageSlug ?? null,
    sceneTags: parseJsonArray(user.sceneTags ?? "[]"),
    referralCount: user.referralCount ?? 0,
    joinedAt: user.createdAt.toISOString().split("T")[0],
  };
}

function serializeVehicle(
  vehicle: {
  id: string;
  userId: string;
  slug?: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  image: string | null;
  vin?: string | null;
  story?: string | null;
  projectStatus?: string | null;
  buildProgress?: number | null;
  installHours?: number | null;
  waitingOnParts?: boolean;
  waitingOnPartsNote?: string | null;
  forSale?: boolean;
  fluidNotes?: string | null;
  mods?: {
    id: string;
    name: string;
    category: string;
    status?: string;
    installedAt: Date;
    estimatedCost?: number | null;
    notes: string | null;
    videoUrl?: string | null;
    affiliateUrl?: string | null;
    partType?: string;
  }[];
  buildLogs?: {
    id: string;
    vehicleId: string;
    title: string;
    content: string;
    milestoneType: string;
    image: string | null;
    images: string;
    dynoHp?: number | null;
    dynoTorque?: number | null;
    lapTime?: string | null;
    trackName?: string | null;
    createdAt: Date;
  }[];
},
  opts?: { includeSensitive?: boolean },
) {
  return {
    id: vehicle.id,
    userId: vehicle.userId,
    slug: vehicle.slug ?? null,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim ?? undefined,
    color: vehicle.color ?? "",
    image: vehicle.image ?? "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop",
    vin: opts?.includeSensitive ? (vehicle.vin ?? undefined) : undefined,
    story: vehicle.story ?? undefined,
    projectStatus: vehicle.projectStatus ?? undefined,
    buildProgress: vehicle.buildProgress ?? undefined,
    installHours: vehicle.installHours ?? undefined,
    waitingOnParts: vehicle.waitingOnParts ?? false,
    waitingOnPartsNote: vehicle.waitingOnPartsNote ?? undefined,
    forSale: vehicle.forSale ?? false,
    fluidNotes: opts?.includeSensitive ? (vehicle.fluidNotes ?? undefined) : undefined,
    mods: (vehicle.mods ?? []).map((mod) => ({
      id: mod.id,
      name: mod.name,
      category: mod.category,
      status: (mod.status ?? "installed") as "installed" | "planned" | "removed",
      installedAt: mod.installedAt.toISOString().split("T")[0],
      estimatedCost: mod.estimatedCost ?? undefined,
      notes: mod.notes ?? undefined,
      videoUrl: mod.videoUrl ?? undefined,
      affiliateUrl: mod.affiliateUrl ?? undefined,
      partType: (mod.partType === "oem" || mod.partType === "custom" ? mod.partType : "aftermarket") as
        | "oem"
        | "aftermarket"
        | "custom",
    })),
    buildLogs: (vehicle.buildLogs ?? []).map((log) => ({
      id: log.id,
      vehicleId: log.vehicleId,
      title: log.title,
      content: log.content,
      milestoneType: log.milestoneType,
      image: log.image ?? undefined,
      images: serializeImagesField(log.images, log.image ?? ""),
      dynoHp: log.dynoHp ?? undefined,
      dynoTorque: log.dynoTorque ?? undefined,
      lapTime: log.lapTime ?? undefined,
      trackName: log.trackName ?? undefined,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

function serializeEvent(event: {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  date: Date;
  time: string;
  organizerId: string;
  clubId: string | null;
  attendeeCount: number;
  maxAttendees: number | null;
  tags: string;
  image: string | null;
  latitude: number | null;
  longitude: number | null;
  recurringRule?: string | null;
  routeJson?: string;
  isOutdoor?: boolean;
  boostedUntil?: Date | null;
  ticketPrice?: number | null;
  ticketUrl?: string | null;
  organizer: Parameters<typeof serializeUser>[0];
  club?: { id: string; slug: string; name: string; image: string | null; isPublic?: boolean } | null;
}) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    city: event.city,
    date: event.date.toISOString().split("T")[0],
    time: event.time,
    organizerId: event.organizerId,
    clubId: event.clubId,
    attendeeCount: event.attendeeCount,
    maxAttendees: event.maxAttendees,
    tags: parseJsonArray(event.tags),
    image: event.image ?? "",
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
    recurringRule: event.recurringRule ?? null,
    routeJson: parseRouteStops(event.routeJson ?? "[]"),
    isOutdoor: event.isOutdoor ?? true,
    boostedUntil: event.boostedUntil?.toISOString() ?? null,
    featured: isBoosted(event.boostedUntil),
    ticketPrice: event.ticketPrice ?? null,
    ticketUrl: event.ticketUrl ?? null,
    organizer: serializeUser(event.organizer),
    club: event.club
      ? {
          id: event.club.id,
          slug: event.club.slug,
          name: event.club.name,
          image: event.club.image,
          isPublic: event.club.isPublic ?? true,
        }
      : null,
  };
}

function serializeClub(
  club: {
    id: string;
    slug: string;
    name: string;
    description: string;
    city: string | null;
    image: string | null;
    coverImage: string | null;
    tags: string;
    ownerId: string;
    memberCount: number;
    isPublic: boolean;
    requiresApproval: boolean;
    merchUrl?: string | null;
    parentClubId?: string | null;
    createdAt: Date;
    owner: Parameters<typeof serializeUser>[0];
  },
  joined = false,
  role: string | null = null,
  joinRequestPending = false,
  pendingRequestCount = 0
) {
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: club.description,
    city: club.city,
    image: club.image,
    coverImage: club.coverImage,
    tags: parseJsonArray(club.tags),
    ownerId: club.ownerId,
    memberCount: club.memberCount,
    isPublic: club.isPublic,
    requiresApproval: club.requiresApproval,
    merchUrl: club.merchUrl ?? null,
    parentClubId: club.parentClubId ?? null,
    createdAt: club.createdAt.toISOString(),
    owner: serializeUser(club.owner),
    joined,
    role,
    joinRequestPending,
    pendingRequestCount,
    access: "full" as const,
  };
}

export { serializeUser, serializeVehicle };

export async function getNearbyPosts(
  latitude: number,
  longitude: number,
  radiusKm = 50,
  limit = 20,
  viewerId?: string | null,
) {
  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];

  const posts = await prisma.post.findMany({
    where: {
      clubId: null,
      status: "published",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      latitude: { not: null },
      longitude: { not: null },
      ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
    },
    include: { user: true, vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const visible = await filterItemsByDiscoverableAuthor(posts, viewerId);

  const filtered = visible
    .map((post) => {
      if (post.latitude == null || post.longitude == null) return null;
      const dist = haversineKm(latitude, longitude, post.latitude, post.longitude);
      return { post, dist };
    })
    .filter((item): item is { post: (typeof posts)[number]; dist: number } => item !== null && item.dist <= radiusKm)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit);

  return filtered.map(({ post, dist }) => {
    const mapped = mapSerializedPost(post);
    const fuzzed = publicListingCoords(post.latitude, post.longitude);
    return {
      ...mapped,
      latitude: fuzzed.latitude ?? null,
      longitude: fuzzed.longitude ?? null,
      distanceKm: Math.round(dist * 10) / 10,
    };
  });
}

export async function getTrendingBuilds(limit = 20, viewerId?: string | null) {
  const include = { user: true } as const;
  const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];
  const baseWhere = {
    clubId: null as null,
    status: "published" as const,
    ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
    AND: [{ OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }] }],
  };

  let posts = await prisma.post.findMany({
    where: {
      ...baseWhere,
      AND: [
        ...baseWhere.AND,
        {
          OR: [
            { postType: { in: ["build", "before-after", "collab"] } },
            { vehicleId: { not: null } },
            { beforeImage: { not: null } },
          ],
        },
      ],
    },
    include,
    orderBy: [{ likes: "desc" }, { createdAt: "desc" }],
    take: limit * 3,
  });

  // Most feed posts are still "standard" — fall back to top liked so the strip isn't empty.
  if (posts.length === 0) {
    posts = await prisma.post.findMany({
      where: baseWhere,
      include,
      orderBy: [{ likes: "desc" }, { createdAt: "desc" }],
      take: limit * 3,
    });
  }

  const visible = await filterItemsByDiscoverableAuthor(posts, viewerId);
  return visible.slice(0, limit).map(mapSerializedPost);
}

export async function getVehicleSpecSheet(vehicleId: string, viewerId?: string | null) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      user: true,
      mods: { orderBy: { installedAt: "desc" } },
      buildLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!vehicle) return null;

  const isOwner = viewerId === vehicle.userId;
  const installedMods = vehicle.mods.filter((m) => m.status === "installed" || !m.status);
  const plannedMods = vehicle.mods.filter((m) => m.status === "planned");
  const totalEstimatedCost = sumInstalledModCosts(vehicle.mods);

  const dynoLog = vehicle.buildLogs.find((l) => l.dynoHp != null || l.dynoTorque != null);

  return {
    vehicle: serializeVehicle(vehicle, { includeSensitive: isOwner }),
    owner: serializeUser(vehicle.user),
    installedMods: installedMods.map((mod) => ({
      id: mod.id,
      name: mod.name,
      category: mod.category,
      status: mod.status as "installed" | "planned" | "removed",
      installedAt: mod.installedAt.toISOString().split("T")[0],
      estimatedCost: mod.estimatedCost ?? undefined,
      notes: isOwner ? mod.notes ?? undefined : undefined,
    })),
    plannedMods: plannedMods.map((mod) => ({
      id: mod.id,
      name: mod.name,
      category: mod.category,
      status: mod.status as "installed" | "planned" | "removed",
      installedAt: mod.installedAt.toISOString().split("T")[0],
      estimatedCost: mod.estimatedCost ?? undefined,
      notes: isOwner ? mod.notes ?? undefined : undefined,
    })),
    buildLogs: serializeVehicle(vehicle, { includeSensitive: isOwner }).buildLogs,
    latestDyno: dynoLog
      ? {
          hp: dynoLog.dynoHp ?? undefined,
          torque: dynoLog.dynoTorque ?? undefined,
          trackName: dynoLog.trackName ?? undefined,
          lapTime: dynoLog.lapTime ?? undefined,
        }
      : undefined,
    totalEstimatedCost,
  };
}

export async function getShopSummaries(userId?: string) {
  const logs = await prisma.maintenanceLog.findMany({
    where: {
      shopName: { not: null },
      ...(userId ? { userId } : {}),
    },
    select: { shopName: true, performedAt: true },
    orderBy: { performedAt: "desc" },
  });

  const shops = new Map<string, { visitCount: number; lastVisit?: Date }>();
  for (const log of logs) {
    if (!log.shopName) continue;
    const existing = shops.get(log.shopName) ?? { visitCount: 0 };
    existing.visitCount += 1;
    if (!existing.lastVisit || log.performedAt > existing.lastVisit) {
      existing.lastVisit = log.performedAt;
    }
    shops.set(log.shopName, existing);
  }

  return [...shops.entries()]
    .map(([name, data]) => ({
      name,
      visitCount: data.visitCount,
      lastVisit: data.lastVisit?.toISOString(),
    }))
    .sort((a, b) => b.visitCount - a.visitCount);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
