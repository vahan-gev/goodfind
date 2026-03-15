import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HeaderButton, Text } from "@react-navigation/elements";
import {
    createStaticNavigation,
    StaticParamList,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Bookmark, Map, User } from "lucide-react-native";
import { MapScreen } from "./screens/MapScreen";
import { SavedScreen } from "./screens/SavedScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { UserProfileScreen } from "./screens/UserProfileScreen";
import { UserPinsScreen } from "./screens/UserPinsScreen";
import { UserDealsScreen } from "./screens/UserDealsScreen";

const HomeTabs = createBottomTabNavigator({
    screenOptions: {
        headerShown: false,
    },
    screens: {
        Map: {
            screen: MapScreen,
            options: {
                title: "Map",
                tabBarIcon: ({ color, size }) => (
                    <Map color={color} size={size} />
                ),
            },
        },
        Saved: {
            screen: SavedScreen,
            options: {
                tabBarIcon: ({ color, size, focused }) => (
                    <Bookmark
                        color={color}
                        size={size}
                        fill={focused ? color : "none"}
                    />
                ),
            },
        },
        Profile: {
            screen: ProfileScreen,
            options: {
                tabBarIcon: ({ color, size, focused }) => (
                    <User
                        color={color}
                        size={size}
                        fill={focused ? color : "none"}
                    />
                ),
            },
        },
    },
});

const RootStack = createNativeStackNavigator({
    screens: {
        HomeTabs: {
            screen: HomeTabs,
            options: {
                title: "Home",
                headerShown: false,
            },
        },
        UserProfile: {
            screen: UserProfileScreen,
            options: {
                headerShown: false,
            },
        },
        UserPins: {
            screen: UserPinsScreen,
            options: {
                headerShown: false,
            },
        },
        UserDeals: {
            screen: UserDealsScreen,
            options: {
                headerShown: false,
            },
        },
    },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}
