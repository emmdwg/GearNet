import type {
  Conversation,
  Event,
  MaintenanceLog,
  MarketplaceListing,
  Message,
  PitUpdate,
  Post,
  ServiceManual,
  User,
  Vehicle,
} from "./types";

export const currentUserId = "user-1";

export const users: User[] = [
  {
    id: "user-1",
    username: "mike_torque",
    displayName: "Mike Torres",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    bio: "LS-swapped everything. Weekend canyon runs & track days.",
    location: "Los Angeles, CA",
    interests: ["JDM", "Track", "LS Swap"],
    joinedAt: "2024-03-15",
  },
  {
    id: "user-2",
    username: "sarah_stance",
    displayName: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    bio: "Air ride enthusiast. Building the cleanest EG in SoCal.",
    location: "San Diego, CA",
    interests: ["Stance", "Honda", "Photography"],
    joinedAt: "2024-01-22",
  },
  {
    id: "user-3",
    username: "diesel_dave",
    displayName: "Dave Morrison",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    bio: "Overlanding builds & diesel tuning. Off-grid ready.",
    location: "Denver, CO",
    interests: ["Overland", "Diesel", "4x4"],
    joinedAt: "2023-11-08",
  },
  {
    id: "user-4",
    username: "classic_anna",
    displayName: "Anna Kowalski",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    bio: "Restoring a '69 Camaro one bolt at a time.",
    location: "Austin, TX",
    interests: ["Classic", "Restoration", "Muscle"],
    joinedAt: "2024-06-01",
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "veh-1",
    userId: "user-1",
    year: 1995,
    make: "Nissan",
    model: "240SX",
    trim: "SE",
    color: "Pearl White",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=500&fit=crop",
    mods: [
      { id: "mod-1", name: "SR20DET Swap", category: "Engine", installedAt: "2024-08-12", notes: "Garrett GT2871R turbo" },
      { id: "mod-2", name: "BC Racing Coilovers", category: "Suspension", installedAt: "2024-09-01" },
      { id: "mod-3", name: "Work Meister S1", category: "Wheels", installedAt: "2024-10-15", notes: "18x9.5 +22" },
    ],
    buildLogs: [
      { id: "bl-1", vehicleId: "veh-1", title: "Turbo manifold fitment", content: "Custom top-mount manifold clears hood by 3mm. Heat wrap applied.", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop", createdAt: "2025-01-10" },
      { id: "bl-2", vehicleId: "veh-1", title: "Dyno pull — 312whp", content: "Conservative tune on 93 octane. Room for more with E85.", createdAt: "2025-02-02" },
    ],
  },
  {
    id: "veh-2",
    userId: "user-2",
    year: 1993,
    make: "Honda",
    model: "Civic",
    trim: "EG Hatch",
    color: "Milano Red",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop",
    mods: [
      { id: "mod-4", name: "Air Lift Performance 3H", category: "Suspension", installedAt: "2024-07-20" },
      { id: "mod-5", name: "BBS LM Reps", category: "Wheels", installedAt: "2024-11-01", notes: "16x8 +15" },
    ],
    buildLogs: [
      { id: "bl-3", vehicleId: "veh-2", title: "Full respray complete", content: "PPG Milano Red with 3-stage clear. Color-matched engine bay.", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop", createdAt: "2025-01-28" },
    ],
  },
  {
    id: "veh-3",
    userId: "user-3",
    year: 2021,
    make: "Toyota",
    model: "Tundra",
    trim: "TRD Pro",
    color: "Army Green",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop",
    mods: [
      { id: "mod-6", name: "Icon Stage 2 Lift", category: "Suspension", installedAt: "2024-05-10" },
      { id: "mod-7", name: "Front Runner Rack", category: "Overland", installedAt: "2024-06-15" },
    ],
    buildLogs: [],
  },
  {
    id: "veh-4",
    userId: "user-4",
    year: 1969,
    make: "Chevrolet",
    model: "Camaro",
    trim: "SS",
    color: "Rally Green",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c698ab?w=800&h=500&fit=crop",
    mods: [
      { id: "mod-8", name: "Original 396ci V8", category: "Engine", installedAt: "1969-01-01", notes: "Numbers matching" },
    ],
    buildLogs: [
      { id: "bl-4", vehicleId: "veh-4", title: "Quarter panel patch", content: "Fabricated patch panel from 18ga steel. Ready for body filler.", createdAt: "2025-02-15" },
    ],
  },
];

export const posts: Post[] = [
  {
    id: "post-1",
    userId: "user-1",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=800&fit=crop",
    caption: "Golden hour at Angeles Crest. Finally dialed in the suspension after last week's alignment.",
    tags: ["240sx", "s14", "canyonrun"],
    likes: 342,
    comments: 28,
    createdAt: "2025-06-18T18:30:00",
    vehicleRef: "veh-1",
  },
  {
    id: "post-2",
    userId: "user-2",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=800&fit=crop",
    caption: "Static fitment check before Cars & Coffee this Saturday. -2° camber all around.",
    tags: ["stance", "honda", "eg6"],
    likes: 518,
    comments: 45,
    createdAt: "2025-06-17T14:00:00",
    vehicleRef: "veh-2",
  },
  {
    id: "post-3",
    userId: "user-3",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&h=800&fit=crop",
    caption: "Trail report: Mosquito Pass is open. Ran it yesterday — no snow above 12,000ft.",
    tags: ["overland", "colorado", "4x4"],
    likes: 189,
    comments: 31,
    createdAt: "2025-06-16T09:15:00",
    vehicleRef: "veh-3",
  },
  {
    id: "post-4",
    userId: "user-4",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c698ab?w=1200&h=800&fit=crop",
    caption: "Engine bay detail day. Original air cleaner cleaned and re-chromed.",
    tags: ["classic", "camaro", "restoration"],
    likes: 276,
    comments: 19,
    createdAt: "2025-06-15T11:45:00",
    vehicleRef: "veh-4",
  },
  {
    id: "post-5",
    userId: "user-1",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=800&fit=crop",
    caption: "Garage session: rewired the entire engine harness. No more mystery gremlins.",
    tags: ["wiring", "buildlog", "sr20"],
    likes: 156,
    comments: 22,
    createdAt: "2025-06-14T20:00:00",
  },
];

export const pitUpdates: PitUpdate[] = [
  { id: "pit-1", userId: "user-2", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=600&fit=crop", caption: "Fresh drop at the shop", expiresAt: "2025-06-21T00:00:00" },
  { id: "pit-2", userId: "user-3", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=600&fit=crop", caption: "Camp setup for the weekend", expiresAt: "2025-06-21T00:00:00" },
  { id: "pit-3", userId: "user-4", image: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&h=600&fit=crop", caption: "Primer is on!", expiresAt: "2025-06-21T00:00:00" },
];

export const events: Event[] = [
  {
    id: "evt-1",
    title: "SoCal Cars & Coffee — June Edition",
    description: "Monthly meet at the usual spot. All makes welcome. No burnouts, respect the lot.",
    location: "Crystal Cove Shopping Center",
    city: "Newport Beach, CA",
    date: "2025-06-22",
    time: "07:00",
    organizerId: "user-2",
    attendeeCount: 87,
    tags: ["meet", "carsandcoffee", "all-makes"],
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop",
  },
  {
    id: "evt-2",
    title: "Angeles Crest Canyon Run",
    description: "Group cruise from La Cañada to Newcomb's Ranch. Pace: spirited but safe. CB channel 19.",
    location: "Angeles Crest Highway — Mile 0",
    city: "La Cañada, CA",
    date: "2025-06-28",
    time: "08:30",
    organizerId: "user-1",
    attendeeCount: 24,
    maxAttendees: 30,
    tags: ["cruise", "canyon", "jdm"],
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop",
  },
  {
    id: "evt-3",
    title: "Rocky Mountain Overland Expo",
    description: "Weekend expo with vendor booths, trail talks, and rig showcases.",
    location: "Bandimere Speedway",
    city: "Morrison, CO",
    date: "2025-07-12",
    time: "09:00",
    organizerId: "user-3",
    attendeeCount: 412,
    tags: ["overland", "expo", "4x4"],
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=400&fit=crop",
  },
  {
    id: "evt-4",
    title: "Austin Classic Car Show",
    description: "Pre-1975 classics only. Judged categories: Original, Restored, Modified.",
    location: "Palmer Events Center",
    city: "Austin, TX",
    date: "2025-07-19",
    time: "10:00",
    organizerId: "user-4",
    attendeeCount: 156,
    tags: ["classic", "show", "judged"],
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c698ab?w=600&h=400&fit=crop",
  },
];

export const conversations: Conversation[] = [
  { id: "conv-1", participantIds: ["user-1", "user-2"], lastMessage: "See you at C&C Saturday!", lastMessageAt: "2025-06-19T16:30:00", unread: 2 },
  { id: "conv-2", participantIds: ["user-1", "user-3"], lastMessage: "What tire size are you running?", lastMessageAt: "2025-06-18T10:15:00", unread: 0 },
  { id: "conv-3", participantIds: ["user-1", "user-4"], lastMessage: "That quarter panel work looks clean", lastMessageAt: "2025-06-17T21:00:00", unread: 1 },
];

export const messages: Message[] = [
  { id: "msg-1", conversationId: "conv-1", senderId: "user-2", content: "Are you bringing the 240 to C&C?", sentAt: "2025-06-19T16:00:00" },
  { id: "msg-2", conversationId: "conv-1", senderId: "user-1", content: "Yeah, fresh wash and detail today", sentAt: "2025-06-19T16:15:00" },
  { id: "msg-3", conversationId: "conv-1", senderId: "user-2", content: "See you at C&C Saturday!", sentAt: "2025-06-19T16:30:00" },
  { id: "msg-4", conversationId: "conv-2", senderId: "user-3", content: "Nice rig in your latest post", sentAt: "2025-06-18T09:45:00" },
  { id: "msg-5", conversationId: "conv-2", senderId: "user-1", content: "Thanks! What tire size are you running?", sentAt: "2025-06-18T10:15:00" },
  { id: "msg-6", conversationId: "conv-3", senderId: "user-4", content: "That quarter panel work looks clean", sentAt: "2025-06-17T21:00:00" },
];

export const marketplaceListings: MarketplaceListing[] = [
  {
    id: "list-1",
    sellerId: "user-1",
    title: "Garrett GT2871R Turbo — lightly used",
    description: "500 miles on the clock. Includes all gaskets and oil feed line. Upgrading to bigger turbo.",
    price: 850,
    category: "parts",
    condition: "like-new",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
    location: "Los Angeles, CA",
    createdAt: "2025-06-10",
    tradeAccepted: true,
  },
  {
    id: "list-2",
    sellerId: "user-2",
    title: "Work Meister S1 18x9.5 +22 (Set of 4)",
    description: "Hyper Silver. Two small curb marks on one wheel. Tires not included.",
    price: 2200,
    category: "wheels",
    condition: "good",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    location: "San Diego, CA",
    createdAt: "2025-06-08",
    tradeAccepted: false,
  },
  {
    id: "list-3",
    sellerId: "user-3",
    title: "2018 Toyota 4Runner TRD Off-Road",
    description: "78k miles, one owner. Icon lift, BFG KO2s, Front Runner rack. Clean title.",
    price: 38500,
    category: "vehicle",
    condition: "good",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=400&fit=crop",
    location: "Denver, CO",
    createdAt: "2025-06-05",
    tradeAccepted: true,
  },
  {
    id: "list-4",
    sellerId: "user-4",
    title: "Holley 4150 Carb — rebuilt",
    description: "Professionally rebuilt 750cfm double pumper. Ready to bolt on.",
    price: 425,
    category: "parts",
    condition: "like-new",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
    location: "Austin, TX",
    createdAt: "2025-06-12",
    tradeAccepted: true,
  },
];

export const maintenanceLogs: MaintenanceLog[] = [
  { id: "ml-1", userId: "user-1", vehicleId: "veh-1", title: "Oil change & filter", description: "Mobil 1 5W-30, NGK plugs checked", mileage: 84200, cost: 45, performedAt: "2025-06-01", category: "Routine" },
  { id: "ml-2", userId: "user-1", vehicleId: "veh-1", title: "Coolant flush", description: "EVANS waterless coolant swap", mileage: 84000, cost: 120, performedAt: "2025-05-15", category: "Cooling" },
  { id: "ml-3", userId: "user-1", vehicleId: "veh-1", title: "Alignment", description: "Corner balanced + aligned at Precision Alignment", mileage: 83800, cost: 180, performedAt: "2025-05-01", category: "Suspension" },
  { id: "ml-4", userId: "user-2", vehicleId: "veh-2", title: "Air bag inspection", description: "All lines checked, no leaks", mileage: 156000, cost: 0, performedAt: "2025-06-10", category: "Suspension" },
];

export const serviceManuals: ServiceManual[] = [
  { id: "sm-1", vehicleMake: "Nissan", vehicleModel: "240SX (S14)", yearRange: "1995–1998", title: "SR20DET Service Guide", sections: ["Timing chain", "Turbo service", "Fuel system", "ECU pinout"] },
  { id: "sm-2", vehicleMake: "Honda", vehicleModel: "Civic (EG)", yearRange: "1992–1995", title: "D/B-Series Engine Manual", sections: ["Valve adjustment", "Clutch replacement", "Head gasket", "Wire tuck guide"] },
  { id: "sm-3", vehicleMake: "Chevrolet", vehicleModel: "Camaro", yearRange: "1967–1969", title: "First-Gen Camaro Restoration", sections: ["Body panel fitment", "Brake rebuild", "Electrical diagrams", "Trim & chrome"] },
];

export function getUser(id: string) {
  return users.find((u) => u.id === id);
}

export function getUserByUsername(username: string) {
  return users.find((u) => u.username === username);
}

export function getUserVehicles(userId: string) {
  return vehicles.filter((v) => v.userId === userId);
}

export function getVehicle(id: string) {
  return vehicles.find((v) => v.id === id);
}

export function getUserPosts(userId: string) {
  return posts.filter((p) => p.userId === userId);
}

export function getConversationMessages(conversationId: string) {
  return messages.filter((m) => m.conversationId === conversationId);
}
