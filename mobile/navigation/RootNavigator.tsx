import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityScreen } from "../screens/ActivityScreen";
import { BenchScreen } from "../screens/BenchScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { ChatThreadScreen } from "../screens/ChatThreadScreen";
import { ExchangeScreen } from "../screens/ExchangeScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import { FollowListScreen } from "../screens/FollowListScreen";
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
import { UserGarageScreen } from "../screens/UserGarageScreen";
import { colors } from "../lib/theme";
import type { RootStackParamList, TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabIcons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Explore: "compass-outline",
  Garage: "car-outline",
  Meets: "calendar-outline",
  Exchange: "cart-outline",
  Chat: "chatbubble-outline",
  Bench: "construct-outline",
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Garage" component={GarageScreen} />
      <Tab.Screen name="Meets" component={MeetsScreen} />
      <Tab.Screen name="Exchange" component={ExchangeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: "Chat" }} />
      <Tab.Screen name="Bench" component={BenchScreen} options={{ tabBarLabel: "Bench" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
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
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="UserGarage" component={UserGarageScreen} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Saved" component={SavedScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="Tag" component={TagScreen} />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="PitUpdateViewer" component={PitUpdateViewerScreen} options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="PostViewer" component={PostViewerScreen} options={{ presentation: "fullScreenModal" }} />
    </Stack.Navigator>
  );
}
