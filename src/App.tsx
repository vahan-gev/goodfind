import { Assets as NavigationAssets } from "@react-navigation/elements";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Asset } from "expo-asset";
import { createURL } from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import * as React from "react";
import { useColorScheme } from "react-native";
import { Navigation } from "./navigation";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { resourceCache } from "@clerk/expo/resource-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

Asset.loadAsync([
    ...NavigationAssets,
]);

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

const prefix = createURL("/");

export function App() {
    const colorScheme = useColorScheme();

    const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

    return (
        <ClerkProvider
            publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
            tokenCache={tokenCache}
            __experimental_resourceCache={resourceCache}
        >
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <Navigation
                    theme={theme}
                    linking={{
                        enabled: "auto",
                        prefixes: [prefix],
                    }}
                    onReady={() => {
                        SplashScreen.hideAsync();
                    }}
                />
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
