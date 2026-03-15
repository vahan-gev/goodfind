import React from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react-native";
import type { Id } from "../../../convex/_generated/dataModel";
import {
    PIN_CATEGORY_MAP,
    type PinType,
} from "../../constants/pinCategories";

export function UserPinsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { userId, displayName } = route.params as {
        userId: string;
        displayName?: string;
    };

    const pins = useQuery(api.users.getUserPins, {
        userId: userId as Id<"users">,
    });

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={s.backBtn}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color="#111" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>
                    {displayName ? `${displayName}'s Pins` : "Pins Made"}
                </Text>
                <View style={s.backBtn} />
            </View>

            {!pins ? (
                <View style={s.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : pins.length === 0 ? (
                <View style={s.centered}>
                    <MapPin size={48} color="#ccc" />
                    <Text style={s.emptyText}>No pins yet</Text>
                </View>
            ) : (
                <FlatList
                    data={pins}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={s.list}
                    renderItem={({ item }) => {
                        const cat = PIN_CATEGORY_MAP[item.type as PinType];
                        const CatIcon = cat?.icon;
                        return (
                            <TouchableOpacity
                                style={s.card}
                                activeOpacity={0.7}
                                onPress={() => {
                                    (navigation as any).navigate("HomeTabs", {
                                        screen: "Map",
                                        params: {
                                            focusCoordinates: item.coordinates,
                                            focusTimestamp: Date.now(),
                                        },
                                    });
                                }}
                            >
                                <View
                                    style={[
                                        s.iconWrap,
                                        {
                                            backgroundColor:
                                                (cat?.color ?? "#999") + "18",
                                        },
                                    ]}
                                >
                                    {CatIcon ? (
                                        <CatIcon width={24} height={24} />
                                    ) : (
                                        <MapPin
                                            size={20}
                                            color={cat?.color ?? "#999"}
                                        />
                                    )}
                                </View>
                                <View style={s.cardBody}>
                                    <Text style={s.cardTitle} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    {item.address ? (
                                        <Text
                                            style={s.cardSub}
                                            numberOfLines={1}
                                        >
                                            {item.address}
                                        </Text>
                                    ) : null}
                                    <View style={s.metaRow}>
                                        <View
                                            style={[
                                                s.typeBadge,
                                                {
                                                    backgroundColor:
                                                        (cat?.color ?? "#999") +
                                                        "18",
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    s.typeText,
                                                    {
                                                        color:
                                                            cat?.color ??
                                                            "#999",
                                                    },
                                                ]}
                                            >
                                                {cat?.label ?? item.type}
                                            </Text>
                                        </View>
                                        {item.deals.length > 0 && (
                                            <Text style={s.dealCount}>
                                                {item.deals.length} deal
                                                {item.deals.length !== 1
                                                    ? "s"
                                                    : ""}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <ChevronRight size={18} color="#ccc" />
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
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
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    emptyText: { fontSize: 16, color: "#999" },
    list: { padding: 16, gap: 10 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#f0f0f0",
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    cardBody: { flex: 1, gap: 2 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
    cardSub: { fontSize: 13, color: "#888" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeText: { fontSize: 11, fontWeight: "600" },
    dealCount: { fontSize: 11, color: "#10B981", fontWeight: "600" },
});
