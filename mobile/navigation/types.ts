import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Post } from "../lib/types";

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  SignIn: undefined;
  SignUp: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  Profile: { username: string };
  ChatThread: {
    conversationId: string;
    otherUser?: { id: string; username: string; displayName: string; avatar: string };
    groupName?: string;
    isGroup?: boolean;
  };
  UserGarage: { username: string };
  Activity: undefined;
  Settings: undefined;
  Saved: undefined;
  Collections: undefined;
  CollectionDetail: { collectionId: string; name: string };
  Search: { query?: string } | undefined;
  ListingDetail: { listingId: string };
  Tag: { tag: string };
  FollowList: { username: string; mode: "followers" | "following" };
  Legal: { doc: "terms" | "privacy" };
  PitUpdateViewer: { updateId: string };
  PostViewer: { postId: string; post?: Post };
  VehicleTimeline: { vehicleId: string };
  CompareBuilds: { vehicleAId: string; vehicleBId: string };
  BuildReels: undefined;
  TradeOffers: undefined;
  MyListings: undefined;
  ClubDetail: { slug: string };
  MeetDay: { eventId: string };
  Bench: undefined;
};

export type TabParamList = {
  Explore: undefined;
  Garage: undefined;
  Meets: { focusEventId?: string } | undefined;
  Clubs: undefined;
  Exchange: { q?: string } | undefined;
  Chat: undefined;
};
