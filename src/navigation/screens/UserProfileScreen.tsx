import React, { useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/expo";
import { api } from "../../../convex/_generated/api";
import { ChevronLeft, ShieldBan, User } from "lucide-react-native";
import type { Id } from "../../../convex/_generated/dataModel";
import { BadgesSection } from "../../components/BadgesSection";

export function UserProfileScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { userId } = route.params as { userId: string };

    const { isSignedIn } = useAuth();
    const profileUser = useQuery(api.users.getById, {
        userId: userId as Id<"users">,
    });
    const pinCount = useQuery(api.users.getPinCount, {
        userId: userId as Id<"users">,
    });
    const dealCount = useQuery(api.users.getDealCount, {
        userId: userId as Id<"users">,
    });
    const currentUser = useQuery(
        api.users.currentUser,
        isSignedIn ? {} : "skip",
    );
    const toggleBlock = useMutation(api.users.toggleBlockUser);

    const isOwner = currentUser?._id === userId;
    const isBlocked = useMemo(
        () => (currentUser?.blockedUsers ?? []).includes(userId as Id<"users">),
        [currentUser, userId],
    );

    const handleToggleBlock = () => {
        const action = isBlocked ? "Unblock" : "Block";
        Alert.alert(
            `${action} User`,
            `Are you sure you want to ${action.toLowerCase()} this user?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: action,
                    style: isBlocked ? "default" : "destructive",
                    onPress: async () => {
                        try {
                            await toggleBlock({
                                userId: userId as Id<"users">,
                            });
                            if (!isBlocked) navigation.goBack();
                        } catch (e: any) {
                            Alert.alert("Error", e.message ?? "Failed");
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.backBtn} />
            </View>

            {!profileUser ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.body}>
                    {profileUser.avatarUrl ? (
                        <Image
                            source={{ uri: profileUser.avatarUrl }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <User size={36} color="#fff" />
                        </View>
                    )}

                    <Text style={styles.name}>{profileUser.displayName}</Text>
                    {profileUser.email ? (
                        <Text style={styles.email}>{profileUser.email}</Text>
                    ) : null}

                    <View style={styles.statsRow}>
                        <TouchableOpacity
                            style={styles.stat}
                            activeOpacity={0.6}
                            onPress={() => {
                                (navigation as any).navigate("UserPins", {
                                    userId,
                                    displayName: profileUser.displayName,
                                });
                            }}
                        >
                            <Text style={styles.statNum}>{pinCount ?? 0}</Text>
                            <Text style={styles.statLabel}>Pins Made</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <TouchableOpacity
                            style={styles.stat}
                            activeOpacity={0.6}
                            onPress={() => {
                                (navigation as any).navigate("UserDeals", {
                                    userId,
                                    displayName: profileUser.displayName,
                                });
                            }}
                        >
                            <Text style={styles.statNum}>{dealCount ?? 0}</Text>
                            <Text style={styles.statLabel}>Deals Posted</Text>
                        </TouchableOpacity>
                    </View>

                    {isSignedIn && !isOwner && (
                        <TouchableOpacity
                            style={[
                                styles.blockBtn,
                                isBlocked && styles.blockBtnActive,
                            ]}
                            onPress={handleToggleBlock}
                            activeOpacity={0.7}
                        >
                            <ShieldBan
                                size={18}
                                color={isBlocked ? "#fff" : "#DC2626"}
                            />
                            <Text
                                style={[
                                    styles.blockBtnText,
                                    isBlocked && styles.blockBtnTextActive,
                                ]}
                            >
                                {isBlocked ? "Unblock User" : "Block User"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <BadgesSection
                        earnedBadges={profileUser.badges ?? []}
                        showLocked={false}
                    />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    body: {
        alignItems: "center",
        paddingTop: 48,
        paddingHorizontal: 32,
        paddingBottom: 48,
        gap: 10,
    },
    avatar: { width: 96, height: 96, borderRadius: 48 },
    avatarPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#2E9E6B",
        justifyContent: "center",
        alignItems: "center",
    },
    name: { fontSize: 24, fontWeight: "700", color: "#111", marginTop: 8 },
    email: { fontSize: 14, color: "#666" },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        gap: 32,
    },
    stat: { alignItems: "center" },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: "#e0e0e0",
    },
    statNum: { fontSize: 20, fontWeight: "700", color: "#111" },
    statLabel: { fontSize: 13, color: "#888", marginTop: 2 },
    blockBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 24,
        borderWidth: 1,
        borderColor: "#DC2626",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 28,
    },
    blockBtnActive: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
    blockBtnText: { fontSize: 16, fontWeight: "600", color: "#DC2626" },
    blockBtnTextActive: { color: "#fff" },
});
