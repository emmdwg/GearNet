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

export type SocialTargetType = "post" | "pit_update";
export type LikeTargetType = SocialTargetType | "comment";

export type Comment = {
  id: string;
  userId: string;
  targetType: SocialTargetType;
  targetId: string;
  parentId?: string | null;
  content: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatar: string };
  replies?: Comment[];
};

export type PitUpdateDetail = PitUpdate & {
  liked: boolean;
  commentList: Comment[];
};

export type PostDetail = Post & {
  liked: boolean;
  bookmarked?: boolean;
  commentList: Comment[];
};

export type FollowStats = {
  followers: number;
  following: number;
  isFollowing: boolean;
};

export type Notification = {
  id: string;
  type: string;
  targetType?: string | null;
  targetId?: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actor: { id: string; username: string; displayName: string; avatar: string };
};

export type UserSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  activityAlerts: boolean;
  messageAlerts: boolean;
  meetReminders: boolean;
  profileVisibility: string;
  showLocation: boolean;
  showGarage: boolean;
  allowMessages: string;
  theme: string;
};

export type UserProfile = {
  username: string;
  displayName: string;
  email: string;
  bio: string;
  location: string;
  avatar: string;
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
  organizer?: { id: string; username: string; displayName: string; avatar: string };
};

export type MeetPin = {
  id: string;
  userId: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  user?: { id: string; username: string; displayName: string; avatar: string };
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
  otherUser: { id: string; username: string; displayName: string; avatar: string } | null;
};

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  image: string;
  images?: string[];
  location: string;
  createdAt: string;
  tradeAccepted: boolean;
  seller?: { username: string };
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
  vehicle?: { year: number; make: string; model: string };
};

export type ServiceManual = {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  yearRange: string;
  title: string;
  sections: string[];
};

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  email: string;
  bio?: string;
  location?: string;
};
