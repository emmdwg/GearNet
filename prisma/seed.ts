import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL. Add Supabase credentials to .env before seeding.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const defaultPassword = "password123";

type SeedUserInput = {
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  interests: string[];
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env before seeding."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function clearSupabaseUsers() {
  const supabase = getSupabaseAdmin();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!data.users.length) break;

    for (const user of data.users) {
      await supabase.auth.admin.deleteUser(user.id);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }
}

async function createSeedUser(input: SeedUserInput) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: { username: input.username, displayName: input.displayName },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create auth user ${input.email}: ${error?.message ?? "unknown error"}`);
  }

  return prisma.user.create({
    data: {
      id: data.user.id,
      username: input.username,
      email: input.email,
      displayName: input.displayName,
      avatar: input.avatar,
      bio: input.bio,
      location: input.location,
      interests: JSON.stringify(input.interests),
    },
  });
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.eventRsvp.deleteMany();
  await prisma.modification.deleteMany();
  await prisma.buildLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.post.deleteMany();
  await prisma.pitUpdate.deleteMany();
  await prisma.meetPin.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.event.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.serviceManual.deleteMany();
  await prisma.user.deleteMany();

  await clearSupabaseUsers();

  const mike = await createSeedUser({
    username: "mike_torque",
    email: "mike@gearnet.app",
    displayName: "Mike Torres",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    bio: "LS-swapped everything. Weekend canyon runs & track days.",
    location: "Los Angeles, CA",
    interests: ["JDM", "Track", "LS Swap"],
  });

  const sarah = await createSeedUser({
    username: "sarah_stance",
    email: "sarah@gearnet.app",
    displayName: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    bio: "Air ride enthusiast. Building the cleanest EG in SoCal.",
    location: "San Diego, CA",
    interests: ["Stance", "Honda", "Photography"],
  });

  const dave = await createSeedUser({
    username: "diesel_dave",
    email: "dave@gearnet.app",
    displayName: "Dave Morrison",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    bio: "Overlanding builds & diesel tuning. Off-grid ready.",
    location: "Denver, CO",
    interests: ["Overland", "Diesel", "4x4"],
  });

  const anna = await createSeedUser({
    username: "classic_anna",
    email: "anna@gearnet.app",
    displayName: "Anna Kowalski",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    bio: "Restoring a '69 Camaro one bolt at a time.",
    location: "Austin, TX",
    interests: ["Classic", "Restoration", "Muscle"],
  });

  const s14 = await prisma.vehicle.create({
    data: {
      userId: mike.id,
      year: 1995,
      make: "Nissan",
      model: "240SX",
      trim: "SE",
      color: "Pearl White",
      image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=500&fit=crop",
      mods: {
        create: [
          { name: "SR20DET Swap", category: "Engine", installedAt: new Date("2024-08-12"), notes: "Garrett GT2871R turbo" },
          { name: "BC Racing Coilovers", category: "Suspension", installedAt: new Date("2024-09-01") },
          { name: "Work Meister S1", category: "Wheels", installedAt: new Date("2024-10-15"), notes: "18x9.5 +22" },
        ],
      },
      buildLogs: {
        create: [
          {
            title: "Turbo manifold fitment",
            content: "Custom top-mount manifold clears hood by 3mm. Heat wrap applied.",
            image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
            createdAt: new Date("2025-01-10"),
          },
          { title: "Dyno pull — 312whp", content: "Conservative tune on 93 octane. Room for more with E85.", createdAt: new Date("2025-02-02") },
        ],
      },
    },
  });

  const eg = await prisma.vehicle.create({
    data: {
      userId: sarah.id,
      year: 1993,
      make: "Honda",
      model: "Civic",
      trim: "EG Hatch",
      color: "Milano Red",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop",
      mods: {
        create: [
          { name: "Air Lift Performance 3H", category: "Suspension", installedAt: new Date("2024-07-20") },
          { name: "BBS LM Reps", category: "Wheels", installedAt: new Date("2024-11-01"), notes: "16x8 +15" },
        ],
      },
      buildLogs: {
        create: [
          {
            title: "Full respray complete",
            content: "PPG Milano Red with 3-stage clear. Color-matched engine bay.",
            image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop",
            createdAt: new Date("2025-01-28"),
          },
        ],
      },
    },
  });

  await prisma.vehicle.create({
    data: {
      userId: dave.id,
      year: 2021,
      make: "Toyota",
      model: "Tundra",
      trim: "TRD Pro",
      color: "Army Green",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop",
      mods: {
        create: [
          { name: "Icon Stage 2 Lift", category: "Suspension", installedAt: new Date("2024-05-10") },
          { name: "Front Runner Rack", category: "Overland", installedAt: new Date("2024-06-15") },
        ],
      },
    },
  });

  const camaro = await prisma.vehicle.create({
    data: {
      userId: anna.id,
      year: 1969,
      make: "Chevrolet",
      model: "Camaro",
      trim: "SS",
      color: "Rally Green",
      image: "https://images.unsplash.com/photo-1583121274602-3e2820c698ab?w=800&h=500&fit=crop",
      mods: {
        create: [{ name: "Original 396ci V8", category: "Engine", installedAt: new Date("1969-01-01"), notes: "Numbers matching" }],
      },
      buildLogs: {
        create: [{ title: "Quarter panel patch", content: "Fabricated patch panel from 18ga steel. Ready for body filler.", createdAt: new Date("2025-02-15") }],
      },
    },
  });

  await prisma.post.createMany({
    data: [
      {
        userId: mike.id,
        image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=800&fit=crop",
        caption: "Golden hour at Angeles Crest. Finally dialed in the suspension after last week's alignment.",
        tags: JSON.stringify(["240sx", "s14", "canyonrun"]),
        likes: 342,
        commentCount: 28,
        createdAt: new Date("2025-06-18T18:30:00"),
      },
      {
        userId: sarah.id,
        image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=800&fit=crop",
        caption: "Static fitment check before Cars & Coffee this Saturday. -2° camber all around.",
        tags: JSON.stringify(["stance", "honda", "eg6"]),
        likes: 518,
        commentCount: 45,
        createdAt: new Date("2025-06-17T14:00:00"),
      },
      {
        userId: dave.id,
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&h=800&fit=crop",
        caption: "Trail report: Mosquito Pass is open. Ran it yesterday — no snow above 12,000ft.",
        tags: JSON.stringify(["overland", "colorado", "4x4"]),
        likes: 189,
        commentCount: 31,
        createdAt: new Date("2025-06-16T09:15:00"),
      },
      {
        userId: anna.id,
        image: "https://images.unsplash.com/photo-1583121274602-3e2820c698ab?w=1200&h=800&fit=crop",
        caption: "Engine bay detail day. Original air cleaner cleaned and re-chromed.",
        tags: JSON.stringify(["classic", "camaro", "restoration"]),
        likes: 276,
        commentCount: 19,
        createdAt: new Date("2025-06-15T11:45:00"),
      },
      {
        userId: mike.id,
        image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=800&fit=crop",
        caption: "Garage session: rewired the entire engine harness. No more mystery gremlins.",
        tags: JSON.stringify(["wiring", "buildlog", "sr20"]),
        likes: 156,
        commentCount: 22,
        createdAt: new Date("2025-06-14T20:00:00"),
      },
    ],
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.pitUpdate.createMany({
    data: [
      { userId: sarah.id, image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=600&fit=crop", caption: "Fresh drop at the shop", expiresAt: tomorrow },
      { userId: dave.id, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=600&fit=crop", caption: "Camp setup for the weekend", expiresAt: tomorrow },
      { userId: anna.id, image: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&h=600&fit=crop", caption: "Primer is on!", expiresAt: tomorrow },
    ],
  });

  await prisma.event.createMany({
    data: [
      {
        title: "SoCal Cars & Coffee — June Edition",
        description: "Monthly meet at the usual spot. All makes welcome. No burnouts, respect the lot.",
        location: "Crystal Cove Shopping Center",
        city: "Newport Beach, CA",
        date: new Date("2025-06-22"),
        time: "07:00",
        organizerId: sarah.id,
        attendeeCount: 87,
        tags: JSON.stringify(["meet", "carsandcoffee", "all-makes"]),
        image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop",
        latitude: 33.6129,
        longitude: -117.876,
      },
      {
        title: "Angeles Crest Canyon Run",
        description: "Group cruise from La Cañada to Newcomb's Ranch. Pace: spirited but safe. CB channel 19.",
        location: "Angeles Crest Highway — Mile 0",
        city: "La Cañada, CA",
        date: new Date("2025-06-28"),
        time: "08:30",
        organizerId: mike.id,
        attendeeCount: 24,
        maxAttendees: 30,
        tags: JSON.stringify(["cruise", "canyon", "jdm"]),
        image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop",
        latitude: 34.2097,
        longitude: -118.2002,
      },
      {
        title: "Rocky Mountain Overland Expo",
        description: "Weekend expo with vendor booths, trail talks, and rig showcases.",
        location: "Bandimere Speedway",
        city: "Morrison, CO",
        date: new Date("2025-07-12"),
        time: "09:00",
        organizerId: dave.id,
        attendeeCount: 412,
        tags: JSON.stringify(["overland", "expo", "4x4"]),
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=400&fit=crop",
        latitude: 39.6536,
        longitude: -105.1911,
      },
      {
        title: "Austin Classic Car Show",
        description: "Pre-1975 classics only. Judged categories: Original, Restored, Modified.",
        location: "Palmer Events Center",
        city: "Austin, TX",
        date: new Date("2025-07-19"),
        time: "10:00",
        organizerId: anna.id,
        attendeeCount: 156,
        tags: JSON.stringify(["classic", "show", "judged"]),
        image: "https://images.unsplash.com/photo-1583121274602-3e2820c698ab?w=600&h=400&fit=crop",
        latitude: 30.2672,
        longitude: -97.7431,
      },
    ],
  });

  await prisma.meetPin.createMany({
    data: [
      {
        userId: mike.id,
        title: "Friday Night Meet Spot",
        description: "Informal JDM hangout every Friday 9pm",
        latitude: 34.0522,
        longitude: -118.2437,
        address: "Los Angeles, CA",
      },
      {
        userId: sarah.id,
        title: "Photo Shoot Pull-Off",
        description: "Great skyline backdrop for car photos",
        latitude: 32.7157,
        longitude: -117.1611,
        address: "San Diego, CA",
      },
    ],
  });

  await prisma.marketplaceListing.createMany({
    data: [
      {
        sellerId: mike.id,
        title: "Garrett GT2871R Turbo — lightly used",
        description: "500 miles on the clock. Includes all gaskets and oil feed line.",
        price: 850,
        category: "parts",
        condition: "like-new",
        image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
        location: "Los Angeles, CA",
        tradeAccepted: true,
      },
      {
        sellerId: sarah.id,
        title: "Work Meister S1 18x9.5 +22 (Set of 4)",
        description: "Hyper Silver. Two small curb marks on one wheel.",
        price: 2200,
        category: "wheels",
        condition: "good",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
        location: "San Diego, CA",
        tradeAccepted: false,
      },
      {
        sellerId: dave.id,
        title: "2018 Toyota 4Runner TRD Off-Road",
        description: "78k miles, one owner. Icon lift, BFG KO2s, Front Runner rack.",
        price: 38500,
        category: "vehicle",
        condition: "good",
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=400&fit=crop",
        location: "Denver, CO",
        tradeAccepted: true,
      },
      {
        sellerId: anna.id,
        title: "Holley 4150 Carb — rebuilt",
        description: "Professionally rebuilt 750cfm double pumper. Ready to bolt on.",
        price: 425,
        category: "parts",
        condition: "like-new",
        image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
        location: "Austin, TX",
        tradeAccepted: true,
      },
    ],
  });

  await prisma.maintenanceLog.createMany({
    data: [
      { userId: mike.id, vehicleId: s14.id, title: "Oil change & filter", description: "Mobil 1 5W-30, NGK plugs checked", mileage: 84200, cost: 45, performedAt: new Date("2025-06-01"), category: "Routine" },
      { userId: mike.id, vehicleId: s14.id, title: "Coolant flush", description: "EVANS waterless coolant swap", mileage: 84000, cost: 120, performedAt: new Date("2025-05-15"), category: "Cooling" },
      { userId: mike.id, vehicleId: s14.id, title: "Alignment", description: "Corner balanced + aligned at Precision Alignment", mileage: 83800, cost: 180, performedAt: new Date("2025-05-01"), category: "Suspension" },
      { userId: sarah.id, vehicleId: eg.id, title: "Air bag inspection", description: "All lines checked, no leaks", mileage: 156000, cost: 0, performedAt: new Date("2025-06-10"), category: "Suspension" },
    ],
  });

  await prisma.serviceManual.createMany({
    data: [
      { vehicleMake: "Nissan", vehicleModel: "240SX (S14)", yearRange: "1995–1998", title: "SR20DET Service Guide", sections: JSON.stringify(["Timing chain", "Turbo service", "Fuel system", "ECU pinout"]) },
      { vehicleMake: "Honda", vehicleModel: "Civic (EG)", yearRange: "1992–1995", title: "D/B-Series Engine Manual", sections: JSON.stringify(["Valve adjustment", "Clutch replacement", "Head gasket", "Wire tuck guide"]) },
      { vehicleMake: "Chevrolet", vehicleModel: "Camaro", yearRange: "1967–1969", title: "First-Gen Camaro Restoration", sections: JSON.stringify(["Body panel fitment", "Brake rebuild", "Electrical diagrams", "Trim & chrome"]) },
    ],
  });

  // --- Social graph: follows so profiles + the Following feed feel populated ---
  await prisma.follow.createMany({
    data: [
      { followerId: sarah.id, followingId: mike.id },
      { followerId: dave.id, followingId: mike.id },
      { followerId: anna.id, followingId: mike.id },
      { followerId: mike.id, followingId: sarah.id },
      { followerId: dave.id, followingId: sarah.id },
      { followerId: mike.id, followingId: dave.id },
      { followerId: anna.id, followingId: dave.id },
      { followerId: sarah.id, followingId: anna.id },
      { followerId: mike.id, followingId: anna.id },
    ],
    skipDuplicates: true,
  });

  // --- Real likes + comments so post engagement isn't hollow ---
  const seededPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true },
  });

  const commenters = [sarah, dave, anna, mike];
  const sampleComments = [
    "This is so clean 🔥",
    "Setup looks dialed in.",
    "Need this energy in my garage.",
    "What spec are you running?",
    "Absolute goals right here.",
  ];
  const likers = [mike, sarah, dave, anna];

  for (const [i, post] of seededPosts.entries()) {
    const commenter = commenters[i % commenters.length];
    if (commenter.id !== post.userId) {
      await prisma.comment.create({
        data: {
          userId: commenter.id,
          targetType: "post",
          targetId: post.id,
          content: sampleComments[i % sampleComments.length],
        },
      });
    }

    for (const liker of likers) {
      if (liker.id === post.userId) continue;
      await prisma.like.create({
        data: { userId: liker.id, targetType: "post", targetId: post.id },
      });
    }
  }

  // --- A couple of bookmarks so the Saved page isn't empty for demo accounts ---
  if (seededPosts.length >= 2) {
    await prisma.bookmark.createMany({
      data: [
        { userId: mike.id, targetType: "post", targetId: seededPosts[1].id },
        { userId: sarah.id, targetType: "post", targetId: seededPosts[0].id },
      ],
      skipDuplicates: true,
    });
  }

  const conv1 = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: mike.id }, { userId: sarah.id }],
      },
      messages: {
        create: [
          { senderId: sarah.id, content: "Are you bringing the 240 to C&C?", sentAt: new Date("2025-06-19T16:00:00") },
          { senderId: mike.id, content: "Yeah, fresh wash and detail today", sentAt: new Date("2025-06-19T16:15:00") },
          { senderId: sarah.id, content: "See you at C&C Saturday!", sentAt: new Date("2025-06-19T16:30:00") },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: mike.id }, { userId: dave.id }],
      },
      messages: {
        create: [
          { senderId: dave.id, content: "Nice rig in your latest post", sentAt: new Date("2025-06-18T09:45:00") },
          { senderId: mike.id, content: "Thanks! What tire size are you running?", sentAt: new Date("2025-06-18T10:15:00") },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: mike.id }, { userId: anna.id }],
      },
      messages: {
        create: [{ senderId: anna.id, content: "That quarter panel work looks clean", sentAt: new Date("2025-06-17T21:00:00") }],
      },
    },
  });

  console.log("Seed complete. Demo login: mike@gearnet.app / password123");
  console.log("Conversation ID sample:", conv1.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
