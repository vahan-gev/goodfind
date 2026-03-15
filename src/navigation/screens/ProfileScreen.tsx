import { useAuth, useUser } from "@clerk/expo";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import React, { useEffect, useMemo } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { GoogleSignInButton } from "../../components/GoogleSignInButton";
import { BadgesSection } from "../../components/BadgesSection";
import { useTheme } from "../../theme/ThemeContext";
import type { ThemeColors } from "../../theme/colors";

const appLogo = require("../../assets/logo/logo.png");

function SignInScreen({ styles }: { styles: ReturnType<typeof createStyles> }) {
    return (
        <View style={styles.authContainer}>
            <Image source={appLogo} style={styles.logo} />
            <Text style={styles.title}>Welcome to GoodFind</Text>
            <Text style={styles.subtitle}>
                Community-sourced pins for food banks, markets, and grocery
                deals - so healthy eating is always within reach.
            </Text>
            <GoogleSignInButton />
        </View>
    );
}

function UserProfile({ styles }: { styles: ReturnType<typeof createStyles> }) {
    const { user } = useUser();
    const { signOut } = useAuth();
    const { isAuthenticated } = useConvexAuth();
    const navigation = useNavigation();
    const storeUser = useMutation(api.users.store);
    const convexUser = useQuery(
        api.users.currentUser,
        isAuthenticated ? {} : "skip",
    );
    const pinCount = useQuery(
        api.users.getPinCount,
        convexUser?._id ? { userId: convexUser._id } : "skip",
    );
    const dealCount = useQuery(
        api.users.getDealCount,
        convexUser?._id ? { userId: convexUser._id } : "skip",
    );

    useEffect(() => {
        if (isAuthenticated) {
            storeUser().catch(console.error);
        }
    }, [isAuthenticated]);

    const displayName =
        convexUser?.displayName ??
        user?.fullName ??
        user?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
        "User";
    const avatarUrl = convexUser?.avatarUrl ?? user?.imageUrl;
    const email = user?.primaryEmailAddress?.emailAddress;
    const bio = convexUser?.bio;

    return (
        <ScrollView contentContainerStyle={styles.profileContainer}>
            {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                        {displayName.charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}

            <Text style={styles.displayName}>{displayName}</Text>
            {email ? <Text style={styles.email}>{email}</Text> : null}

            {bio ? <Text style={styles.bio}>{bio}</Text> : null}

            <View style={styles.statsRow}>
                <TouchableOpacity
                    style={styles.stat}
                    activeOpacity={0.6}
                    onPress={() => {
                        if (convexUser?._id) {
                            (navigation as any).navigate("UserPins", {
                                userId: convexUser._id,
                                displayName: displayName,
                            });
                        }
                    }}
                >
                    <Text style={styles.statNumber}>{pinCount ?? 0}</Text>
                    <Text style={styles.statLabel}>Pins Made</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity
                    style={styles.stat}
                    activeOpacity={0.6}
                    onPress={() => {
                        if (convexUser?._id) {
                            (navigation as any).navigate("UserDeals", {
                                userId: convexUser._id,
                                displayName: displayName,
                            });
                        }
                    }}
                >
                    <Text style={styles.statNumber}>{dealCount ?? 0}</Text>
                    <Text style={styles.statLabel}>Deals Posted</Text>
                </TouchableOpacity>
            </View>

            <BadgesSection earnedBadges={convexUser?.badges ?? []} />

            <TouchableOpacity
                style={styles.signOutButton}
                onPress={() => signOut()}
            >
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

export function ProfileScreen() {
    const { isSignedIn } = useAuth();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            {isSignedIn ? <UserProfile styles={styles} /> : <SignInScreen styles={styles} />}
        </SafeAreaView>
    );
}

function createStyles(colors: ThemeColors) {
    return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    authContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
        gap: 12,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 24,
        marginBottom: 16,
    },
    logoSmall: {
        width: 56,
        height: 56,
        borderRadius: 14,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: colors.text,
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textCaption,
        textAlign: "center",
        marginBottom: 24,
    },
    profileContainer: {
        alignItems: "center",
        paddingVertical: 32,
        paddingHorizontal: 24,
        gap: 12,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    avatarPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarInitial: {
        color: colors.onPrimary,
        fontSize: 36,
        fontWeight: "700",
    },
    displayName: {
        fontSize: 24,
        fontWeight: "700",
        color: colors.text,
    },
    email: {
        fontSize: 15,
        color: colors.textCaption,
    },
    bio: {
        fontSize: 15,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: 4,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        gap: 32,
    },
    stat: {
        alignItems: "center",
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.border,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text,
    },
    statLabel: {
        fontSize: 13,
        color: colors.textCaption,
        marginTop: 2,
    },
    signOutButton: {
        marginTop: 24,
        borderWidth: 1,
        borderColor: colors.destructive,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    signOutText: {
        color: colors.destructiveText,
        fontSize: 16,
        fontWeight: "600",
    },
});
}
