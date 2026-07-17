import { Ionicons } from "@expo/vector-icons";
import {
  BottomTabBar,
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityScreen } from "../screens/ActivityScreen";
import { BenchScreen } from "../screens/BenchScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { ChatThreadScreen } from "../screens/ChatThreadScreen";
import { ExchangeScreen } from "../screens/ExchangeScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import { FollowListScreen } from "../screens/FollowListScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { GarageScreen } from "../screens/GarageScreen";
import { ListingDetailScreen } from "../screens/ListingDetailScreen";
import { TagScreen } from "../screens/TagScreen";
import { LegalScreen } from "../screens/LegalScreen";
import { MeetsScreen } from "../screens/MeetsScreen";
import { PitUpdateViewerScreen } from "../screens/PitUpdateViewerScreen";
import { PostViewerScreen } from "../screens/PostViewerScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SavedScreen } from "../screens/SavedScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { VerifyEmailScreen } from "../screens/VerifyEmailScreen";
import { ClubDetailScreen } from "../screens/ClubDetailScreen";
import { ClubsScreen } from "../screens/ClubsScreen";
import { CollectionDetailScreen } from "../screens/CollectionDetailScreen";
import { CollectionsScreen } from "../screens/CollectionsScreen";
import { TradeOffersScreen } from "../screens/TradeOffersScreen";
import { MyListingsScreen } from "../screens/MyListingsScreen";
import { CompareBuildsScreen } from "../screens/CompareBuildsScreen";
import { BuildReelsScreen } from "../screens/BuildReelsScreen";
import { MeetDayScreen } from "../screens/MeetDayScreen";
import { VehicleTimelineScreen } from "../screens/VehicleTimelineScreen";
import { UserGarageScreen } from "../screens/UserGarageScreen";
import { ScrollChromeProvider, useScrollChrome } from "../lib/scroll-chrome";
import { colors } from "../lib/theme";
import type { RootStackParamList, TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabIcons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Explore: "compass-outline",
  Garage: "car-outline",
  Meets: "calendar-outline",
  Clubs: "people-outline",
  Exchange: "cart-outline",
  Chat: "chatbubble-outline",
};

function HidingTabBar(props: BottomTabBarProps) {
  const { progress, tabBarHeight, setTabBarHeight, show } = useScrollChrome();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const height = 52 + bottomPad;

  useEffect(() => {
    setTabBarHeight(height);
  }, [height, setTabBarHeight]);

  useEffect(() => {
    const unsub = props.navigation.addListener("state", () => show());
    return unsub;
  }, [props.navigation, show]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, tabBarHeight || height],
            }),
          },
        ],
      }}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      tabBar={(props) => <HidingTabBar {...props} />}
      screenOptions={({ route }) => ({
        lazy: true,
        headerShown: false,
        sceneStyle: { paddingBottom: 52 + bottomPad },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 52 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
        tabBarItemStyle: { minHeight: 44 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Garage" component={GarageScreen} />
      <Tab.Screen name="Meets" component={MeetsScreen} />
      <Tab.Screen name="Clubs" component={ClubsScreen} />
      <Tab.Screen name="Exchange" component={ExchangeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: "Chat" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <ScrollChromeProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="UserGarage" component={UserGarageScreen} />
        <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
        <Stack.Screen name="Activity" component={ActivityScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Saved" component={SavedScreen} />
        <Stack.Screen name="Collections" component={CollectionsScreen} />
        <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
        <Stack.Screen name="Tag" component={TagScreen} />
        <Stack.Screen name="FollowList" component={FollowListScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="MeetDay" component={MeetDayScreen} />
        <Stack.Screen name="VehicleTimeline" component={VehicleTimelineScreen} />
        <Stack.Screen name="CompareBuilds" component={CompareBuildsScreen} />
        <Stack.Screen
          name="BuildReels"
          component={BuildReelsScreen}
          options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="TradeOffers" component={TradeOffersScreen} />
        <Stack.Screen name="MyListings" component={MyListingsScreen} />
        <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
        <Stack.Screen name="Bench" component={BenchScreen} />
        <Stack.Screen
          name="PitUpdateViewer"
          component={PitUpdateViewerScreen}
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="PostViewer"
          component={PostViewerScreen}
          options={{ presentation: "fullScreenModal" }}
        />
      </Stack.Navigator>
    </ScrollChromeProvider>
  );
}
