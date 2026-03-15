import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BADGE_CATEGORIES, BADGE_MAP } from "../constants/badges";
import { useTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";

interface Props {
    earnedBadges: string[];
    showLocked?: boolean;
}

export function BadgesSection({ earnedBadges, showLocked = true }: Props) {
    const { colors } = useTheme();
    const st = useMemo(() => createStyles(colors), [colors]);
    const earnedSet = new Set(earnedBadges);

    const hasVisibleBadges =
        showLocked ||
        BADGE_CATEGORIES.some((cat) => cat.ids.some((id) => earnedSet.has(id)));

    return (
        <View style={st.section}>
            <Text style={st.sectionTitle}>Badges</Text>
            {!hasVisibleBadges && (
                <Text style={st.emptyText}>No badges earned yet</Text>
            )}
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
                                        <Text
                                            style={st.badgeDesc}
                                            numberOfLines={2}
                                        >
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

function createStyles(colors: ThemeColors) {
    return StyleSheet.create({
    section: {
        width: "100%",
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 20,
    },
    category: {
        marginBottom: 24,
    },
    categoryLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.primary,
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
        backgroundColor: colors.primaryTint,
    },
    iconWrapLocked: {
        backgroundColor: colors.cardBorderLight,
    },
    badgeLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: 2,
    },
    badgeLabelLocked: {
        color: colors.textPlaceholder,
    },
    badgeDesc: {
        fontSize: 10,
        color: colors.textPlaceholder,
        textAlign: "center",
        lineHeight: 13,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textDisabled,
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
    },
});
}
