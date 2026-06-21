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
    otherUser: { id: string; username: string; displayName: string; avatar: string };
  };
  UserGarage: { username: string };
  Activity: undefined;
  Settings: undefined;
  Saved: undefined;
  Search: { query?: string } | undefined;
  ListingDetail: { listingId: string };
  Tag: { tag: string };
  FollowList: { username: string; mode: "followers" | "following" };
  Legal: { doc: "terms" | "privacy" };
  PitUpdateViewer: { updateId: string };
  PostViewer: { postId: string; post?: Post };
};

export type TabParamList = {
  Explore: undefined;
  Garage: undefined;
  Meets: undefined;
  Exchange: undefined;
  Chat: undefined;
  Bench: undefined;
};
