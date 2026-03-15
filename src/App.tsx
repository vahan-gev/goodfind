import { Assets as NavigationAssets } from "@react-navigation/elements";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Asset } from "expo-asset";
import { createURL } from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import * as React from "react";
import { StatusBar } from "react-native";
import { Navigation } from "./navigation";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { resourceCache } from "@clerk/expo/resource-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";

Asset.loadAsync([...NavigationAssets]);

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

const prefix = createURL("/");

function AppContent() {
    const { colors, isDark } = useTheme();
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    const theme = {
        ...baseTheme,
        colors: {
            ...baseTheme.colors,
            primary: colors.primary,
        },
    };

    return (
        <>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor="transparent"
            />
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
        </>
    );
}

export function App() {
    return (
        <ThemeProvider>
            <ClerkProvider
                publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
                tokenCache={tokenCache}
                __experimental_resourceCache={resourceCache}
            >
                <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                    <AppContent />
                </ConvexProviderWithClerk>
            </ClerkProvider>
        </ThemeProvider>
    );
}
