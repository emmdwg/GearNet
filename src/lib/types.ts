export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  interests: string[];
  joinedAt: string;
};

export type Vehicle = {
  id: string;
  userId: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color: string;
  image: string;
  mods: Modification[];
  buildLogs: BuildLog[];
};

export type Modification = {
  id: string;
  name: string;
  category: string;
  installedAt: string;
  notes?: string;
};

export type BuildLog = {
  id: string;
  vehicleId: string;
  title: string;
  content: string;
  image?: string;
  createdAt: string;
};

export type Post = {
  id: string;
  userId: string;
  image: string;
  images?: string[];
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  vehicleRef?: string;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export type PitUpdate = {
  id: string;
  userId: string;
  image: string;
  caption: string;
  expiresAt: string;
  likes?: number;
  comments?: number;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  date: string;
  time: string;
  organizerId: string;
  attendeeCount: number;
  maxAttendees?: number | null;
  tags: string[];
  image: string;
  latitude?: number;
  longitude?: number;
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
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: "vehicle" | "parts" | "wheels" | "accessories" | "trade";
  condition: "new" | "like-new" | "good" | "fair" | "project";
  image: string;
  images?: string[];
  location: string;
  createdAt: string;
  tradeAccepted: boolean;
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
};

export type ServiceManual = {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  yearRange: string;
  title: string;
  sections: string[];
};
