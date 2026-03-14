import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BADGE_CATEGORIES, BADGE_MAP } from "../constants/badges";

interface Props {
    earnedBadges: string[];
    showLocked?: boolean;
}

export function BadgesSection({ earnedBadges, showLocked = true }: Props) {
    const earnedSet = new Set(earnedBadges);

    return (
        <View style={st.section}>
            <Text style={st.sectionTitle}>Badges</Text>
            {BADGE_CATEGORIES.map((cat) => {
                const visibleIds = showLocked
                    ? cat.ids
                    : cat.ids.filter((id) => earnedSet.has(id));
                if (visibleIds.length === 0) return null;
                return (
                <View key={cat.label} style={st.category}>
                    <Text style={st.categoryLabel}>{cat.label}</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={st.row}
                    >
                        {visibleIds.map((id) => {
                            const badge = BADGE_MAP[id];
                            if (!badge) return null;
                            const earned = earnedSet.has(id);
                            const Icon = badge.icon;
                            return (
                                <View
                                    key={id}
                                    style={[
                                        st.badgeItem,
                                        !earned && st.badgeItemLocked,
                                    ]}
                                >
                                    <View
                                        style={[
                                            st.iconWrap,
                                            earned
                                                ? st.iconWrapEarned
                                                : st.iconWrapLocked,
                                        ]}
                                    >
                                        <Icon
                                            width={42}
                                            height={42}
                                            opacity={earned ? 1 : 0.3}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            st.badgeLabel,
                                            !earned && st.badgeLabelLocked,
                                        ]}
                                    >
                                        {badge.label}
                                    </Text>
                                    <Text style={st.badgeDesc} numberOfLines={2}>
                                        {badge.description}
                                    </Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
                );
            })}
        </View>
    );
}

const st = StyleSheet.create({
    section: {
        width: "100%",
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        marginBottom: 20,
    },
    category: {
        marginBottom: 24,
    },
    categoryLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#4F46E5",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        paddingBottom: 4,
    },
    badgeItem: {
        width: 80,
        alignItems: "center",
        gap: 4,
    },
    badgeItemLocked: {
        opacity: 0.4,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    iconWrapEarned: {
        backgroundColor: "#EEF2FF",
    },
    iconWrapLocked: {
        backgroundColor: "#f0f0f0",
    },
    badgeLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#222",
        textAlign: "center",
        marginTop: 2,
    },
    badgeLabelLocked: {
        color: "#aaa",
    },
    badgeDesc: {
        fontSize: 10,
        color: "#888",
        textAlign: "center",
        lineHeight: 13,
    },
});
