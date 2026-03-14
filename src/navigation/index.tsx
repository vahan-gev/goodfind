import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HeaderButton, Text } from "@react-navigation/elements";
import {
    createStaticNavigation,
    StaticParamList,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Settings } from "./screens/Settings";
import { NotFound } from "./screens/NotFound";
import { Bookmark, Map, User } from "lucide-react-native";
import { MapScreen } from "./screens/MapScreen";
import { SavedScreen } from "./screens/SavedScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { UserProfileScreen } from "./screens/UserProfileScreen";

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
                tabBarIcon: ({ color, size }) => (
                    <Bookmark color={color} size={size} />
                ),
            },
        },
        Profile: {
            screen: ProfileScreen,
            options: {
                tabBarIcon: ({ color, size }) => (
                    <User color={color} size={size} />
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
        Settings: {
            screen: Settings,
            options: ({ navigation }) => ({
                presentation: "modal",
                headerRight: () => (
                    <HeaderButton onPress={navigation.goBack}>
                        <Text>Close</Text>
                    </HeaderButton>
                ),
            }),
        },
        NotFound: {
            screen: NotFound,
            options: {
                title: "404",
            },
            linking: {
                path: "*",
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
