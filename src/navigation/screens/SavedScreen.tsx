import { useMemo, useState } from "react";
import { useAuth } from "@clerk/expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bookmark, Map, MapPinned, Search, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { PIN_CATEGORY_MAP, type PinType } from "../../constants/pinCategories";
import { GoogleSignInButton } from "../../components/GoogleSignInButton";
import { PinDetailModal } from "../../components/PinDetailModal";
import { useTheme } from "../../theme/ThemeContext";
import type { ThemeColors } from "../../theme/colors";
import type { Doc } from "../../../convex/_generated/dataModel";

export function SavedScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { isSignedIn } = useAuth();
    const navigation = useNavigation();
    const currentUser = useQuery(
        api.users.currentUser,
        isSignedIn ? {} : "skip",
    );
    const savedPins = useQuery(
        api.pins.getByIds,
        currentUser && currentUser.savedPins.length > 0
            ? { pinIds: currentUser.savedPins }
            : "skip",
    );
    const toggleSave = useMutation(api.users.toggleSavePin);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPin, setSelectedPin] = useState<Doc<"pins"> | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    const filteredPins = useMemo(() => {
        if (!savedPins) return [];
        const valid = savedPins.filter(Boolean) as Doc<"pins">[];
        if (!searchQuery.trim()) return valid;
        const q = searchQuery.toLowerCase();
        return valid.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.address?.toLowerCase().includes(q) ||
                p.type.replace("_", " ").includes(q),
        );
    }, [savedPins, searchQuery]);

    const handleUnsave = async (pinId: any) => {
        try {
            await toggleSave({ pinId });
        } catch (err: any) {
            Alert.alert("Error", err.message ?? "Failed to unsave");
        }
    };

    if (!isSignedIn) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.authContainer}>
                    <View style={styles.iconCircle}>
                        <Bookmark size={32} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.authTitle}>Your Saved Pins</Text>
                    <Text style={styles.authSubtitle}>
                        Sign in to save and revisit your favorite food resources
                    </Text>
                    <View style={styles.authButtonWrapper}>
                        <GoogleSignInButton />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (!currentUser) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            </SafeAreaView>
        );
    }

    if (currentUser.savedPins.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Bookmark size={36} color={colors.iconDisabled} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.emptyTitle}>No saved pins yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Tap the bookmark icon on any pin to save it here for
                        quick access
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.screenTitle}>Saved Pins</Text>

            <View style={styles.searchWrapper}>
                <View style={styles.searchBar}>
                    <Search size={18} color={colors.iconMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search saved pins..."
                        placeholderTextColor={colors.textPlaceholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery("")}
                            activeOpacity={0.6}
                        >
                            <X size={18} color={colors.iconMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {!savedPins ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {filteredPins.length === 0 && searchQuery.trim() ? (
                        <Text style={styles.noResults}>
                            No pins match your search
                        </Text>
                    ) : (
                        filteredPins.map((pin) => {
                            const cat = PIN_CATEGORY_MAP[pin.type as PinType];
                            const Icon = cat.icon;
                            return (
                                <TouchableOpacity
                                    key={pin._id}
                                    style={styles.card}
                                    onPress={() => {
                                        setSelectedPin(pin);
                                        setDetailVisible(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[
                                            styles.cardIconCircle,
                                            {
                                                backgroundColor:
                                                    cat.color + "18",
                                            },
                                        ]}
                                    >
                                        <Icon width={24} height={24} />
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardName}>
                                            {pin.name}
                                        </Text>
                                        <View style={styles.cardMeta}>
                                            <View
                                                style={[
                                                    styles.cardBadge,
                                                    {
                                                        backgroundColor:
                                                            cat.color + "18",
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.cardBadgeText,
                                                        { color: cat.color },
                                                    ]}
                                                >
                                                    {cat.label}
                                                </Text>
                                            </View>
                                        </View>
                                        {pin.address ? (
                                            <View style={styles.cardAddressRow}>
                                                <MapPinned
                                                    size={12}
                                                    color={colors.iconPlaceholder}
                                                />
                                                <Text
                                                    style={styles.cardAddress}
                                                    numberOfLines={1}
                                                >
                                                    {pin.address}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity
                                            style={styles.viewOnMapButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                (navigation as any).navigate(
                                                    "Map",
                                                    {
                                                        focusCoordinates:
                                                            pin.coordinates,
                                                        focusTimestamp:
                                                            Date.now(),
                                                    },
                                                );
                                            }}
                                            activeOpacity={0.6}
                                        >
                                            <Map size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.unsaveButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleUnsave(pin._id);
                                            }}
                                            activeOpacity={0.6}
                                        >
                                            <Bookmark
                                                size={18}
                                                color={colors.primary}
                                                fill={colors.primary}
                                                strokeWidth={2}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            )}

            <PinDetailModal
                pin={selectedPin}
                visible={detailVisible}
                onClose={() => {
                    setDetailVisible(false);
                    setSelectedPin(null);
                }}
                onViewProfile={(userId) => {
                    setDetailVisible(false);
                    setSelectedPin(null);
                    (navigation as any).navigate("UserProfile", { userId });
                }}
            />
        </SafeAreaView>
    );
}

function createStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        centered: { flex: 1, justifyContent: "center", alignItems: "center" },
        screenTitle: {
            fontSize: 28,
            fontWeight: "700",
            color: colors.text,
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 12,
        },

        searchWrapper: { paddingHorizontal: 16, marginBottom: 12 },
        searchBar: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
        },
        searchInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },

        listContainer: { paddingHorizontal: 16, gap: 10, paddingBottom: 24 },
        noResults: {
            textAlign: "center",
            color: colors.textPlaceholder,
            fontSize: 15,
            paddingTop: 40,
        },

        authContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
            gap: 12,
        },
        iconCircle: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.primaryTint,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8,
        },
        authTitle: {
            fontSize: 24,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
        },
        authSubtitle: {
            fontSize: 15,
            color: colors.textCaption,
            textAlign: "center",
            marginBottom: 16,
        },
        authButtonWrapper: { width: "100%" },

        emptyContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
            gap: 10,
        },
        emptyIconCircle: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.backgroundSecondary,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8,
        },
        emptyTitle: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.textMuted,
            textAlign: "center",
        },
        emptySubtitle: {
            fontSize: 14,
            color: colors.textDisabled,
            textAlign: "center",
            lineHeight: 20,
        },

        card: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            borderRadius: 14,
            padding: 14,
            gap: 12,
        },
        cardIconCircle: {
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
        },
        cardContent: { flex: 1 },
        cardName: { fontSize: 16, fontWeight: "700", color: colors.textSecondary },
        cardMeta: { flexDirection: "row", marginTop: 4, gap: 6 },
        cardBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
        cardBadgeText: { fontSize: 11, fontWeight: "600" },
        cardAddressRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
        },
        cardAddress: { fontSize: 12, color: colors.textPlaceholder, flex: 1 },
        cardActions: { flexDirection: "column", gap: 6 },
        viewOnMapButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primaryTint,
            justifyContent: "center",
            alignItems: "center",
        },
        unsaveButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primaryTint,
            justifyContent: "center",
            alignItems: "center",
        },
    });
}
