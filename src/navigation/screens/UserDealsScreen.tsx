import React, { useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";
import type { ThemeColors } from "../../theme/colors";
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
import { ChevronLeft, ChevronRight, Tag } from "lucide-react-native";
import type { Id } from "../../../convex/_generated/dataModel";
import { PIN_CATEGORY_MAP, type PinType } from "../../constants/pinCategories";

export function UserDealsScreen() {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { userId, displayName } = route.params as {
        userId: string;
        displayName?: string;
    };

    const deals = useQuery(api.users.getUserDeals, {
        userId: userId as Id<"users">,
    });

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={s.backBtn}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color={colors.icon} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>
                    {displayName ? `${displayName}'s Deals` : "Deals Posted"}
                </Text>
                <View style={s.backBtn} />
            </View>

            {!deals ? (
                <View style={s.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : deals.length === 0 ? (
                <View style={s.centered}>
                    <Tag size={48} color={colors.iconDisabled} />
                    <Text style={s.emptyText}>No deals yet</Text>
                </View>
            ) : (
                <FlatList
                    data={deals}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={s.list}
                    renderItem={({ item }) => {
                        const cat = PIN_CATEGORY_MAP[item.pinType as PinType];
                        const CatIcon = cat?.icon;
                        return (
                            <TouchableOpacity
                                style={s.card}
                                activeOpacity={0.7}
                                onPress={() => {
                                    (navigation as any).navigate("HomeTabs", {
                                        screen: "Map",
                                        params: {
                                            focusCoordinates: undefined,
                                            focusTimestamp: undefined,
                                        },
                                    });
                                }}
                            >
                                <View
                                    style={[
                                        s.iconWrap,
                                        { backgroundColor: colors.dealsTint },
                                    ]}
                                >
                                    <Tag size={20} color={colors.deals} />
                                </View>
                                <View style={s.cardBody}>
                                    <Text style={s.cardTitle} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <View style={s.pinRow}>
                                        {CatIcon && (
                                            <CatIcon width={14} height={14} />
                                        )}
                                        <Text
                                            style={s.pinName}
                                            numberOfLines={1}
                                        >
                                            {item.pinName}
                                        </Text>
                                    </View>
                                    <Text style={s.cardSub} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                    <Text style={s.date}>
                                        {formatDate(item.createdAt)}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color={colors.iconDisabled} />
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

function createStyles(colors: ThemeColors) {
    return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorderLight,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
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
    emptyText: { fontSize: 16, color: colors.textDisabled },
    list: { padding: 16, gap: 10 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.background,
        borderRadius: 14,
        padding: 14,
        gap: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.cardBorderLight,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    cardBody: { flex: 1, gap: 2 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
    pinRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    pinName: { fontSize: 12, color: colors.primary, fontWeight: "500" },
    cardSub: { fontSize: 13, color: colors.textPlaceholder, marginTop: 2 },
    date: { fontSize: 11, color: colors.textDate, marginTop: 4 },
});
}
