import type { FC } from "react";
import type { SvgProps } from "react-native-svg";

import BadgeFirstSprout from "../assets/badges/first_sprout.svg";
import BadgePathfinder from "../assets/badges/pathfinder.svg";
import BadgeCommunityPillar from "../assets/badges/community_pillar.svg";
import BadgeLocalLegend from "../assets/badges/local_legend.svg";
import BadgeDealHunter from "../assets/badges/deal_hunter.svg";
import BadgeOnARoll from "../assets/badges/on_a_roll.svg";
import BadgeTrustedSource from "../assets/badges/trusted_source.svg";
import BadgeMarketRegular from "../assets/badges/market_regular.svg";
import BadgeGivingBack from "../assets/badges/giving_back.svg";
import BadgeGoodFinder from "../assets/badges/good_finder.svg";

export interface BadgeInfo {
    id: string;
    label: string;
    description: string;
    icon: FC<SvgProps>;
}

export const BADGES: BadgeInfo[] = [
    {
        id: "first_sprout",
        label: "First Sprout",
        description: "Post your first pin",
        icon: BadgeFirstSprout,
    },
    {
        id: "pathfinder",
        label: "Pathfinder",
        description: "Post 5 pins",
        icon: BadgePathfinder,
    },
    {
        id: "community_pillar",
        label: "Community Pillar",
        description: "Post 10 pins",
        icon: BadgeCommunityPillar,
    },
    {
        id: "local_legend",
        label: "Local Legend",
        description: "Post 25 pins",
        icon: BadgeLocalLegend,
    },
    {
        id: "deal_hunter",
        label: "Deal Hunter",
        description: "Post your first deal",
        icon: BadgeDealHunter,
    },
    {
        id: "on_a_roll",
        label: "On a Roll",
        description: "Post 5 deals",
        icon: BadgeOnARoll,
    },
    {
        id: "trusted_source",
        label: "Trusted Source",
        description: "Never have a flag upheld",
        icon: BadgeTrustedSource,
    },
    {
        id: "market_regular",
        label: "Market Regular",
        description: "Pin a farmers market",
        icon: BadgeMarketRegular,
    },
    {
        id: "giving_back",
        label: "Giving Back",
        description: "Pin a food bank or pantry",
        icon: BadgeGivingBack,
    },
    {
        id: "good_finder",
        label: "GoodFinder",
        description: "Have a pin saved by 10 people",
        icon: BadgeGoodFinder,
    },
];

export const BADGE_MAP = Object.fromEntries(
    BADGES.map((b) => [b.id, b]),
) as Record<string, BadgeInfo>;

export interface BadgeCategory {
    label: string;
    ids: string[];
}

export const BADGE_CATEGORIES: BadgeCategory[] = [
    {
        label: "Explorer",
        ids: ["first_sprout", "pathfinder", "local_legend"],
    },
    {
        label: "Community",
        ids: ["community_pillar", "giving_back", "market_regular"],
    },
    {
        label: "Deal Master",
        ids: ["deal_hunter", "on_a_roll"],
    },
    {
        label: "Reputation",
        ids: ["trusted_source", "good_finder"],
    },
];
