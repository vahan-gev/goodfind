import PinFoodBank from "../assets/pins/pin_food_bank.svg";
import PinGrocery from "../assets/pins/pin_grocery.svg";
import PinFarmersMarket from "../assets/pins/pin_farmers_market.svg";
import PinCommunityGarden from "../assets/pins/pin_community_garden.svg";
import PinPantry from "../assets/pins/pin_pantry.svg";
import PinOther from "../assets/pins/pin_other.svg";
import PinTemporary from "../assets/pins/pin_temporary.svg";

import IconFoodBank from "../assets/icons/icon_food_bank.svg";
import IconGrocery from "../assets/icons/icon_grocery.svg";
import IconFarmersMarket from "../assets/icons/icon_farmers_market.svg";
import IconCommunityGarden from "../assets/icons/icon_community_garden.svg";
import IconPantry from "../assets/icons/icon_pantry.svg";
import IconOther from "../assets/icons/icon_other.svg";

import type { ImageRequireSource } from "react-native";
import type { SvgProps } from "react-native-svg";
import type { FC } from "react";

export type PinType =
    | "food_bank"
    | "grocery"
    | "farmers_market"
    | "community_garden"
    | "pantry"
    | "other"
    | "temporary";

export interface PinCategory {
    type: PinType;
    label: string;
    pinIcon: FC<SvgProps>;
    pinImage: ImageRequireSource;
    icon: FC<SvgProps>;
    color: string;
}

export const PIN_CATEGORIES: PinCategory[] = [
    {
        type: "food_bank",
        label: "Food Bank",
        pinIcon: PinFoodBank,
        pinImage: require("../assets/pins/png/pin_food_bank.png"),
        icon: IconFoodBank,
        color: "#E8593C",
    },
    {
        type: "grocery",
        label: "Grocery",
        pinIcon: PinGrocery,
        pinImage: require("../assets/pins/png/pin_grocery.png"),
        icon: IconGrocery,
        color: "#2E9E6B",
    },
    {
        type: "farmers_market",
        label: "Farmers Market",
        pinIcon: PinFarmersMarket,
        pinImage: require("../assets/pins/png/pin_farmers_market.png"),
        icon: IconFarmersMarket,
        color: "#F2A623",
    },
    {
        type: "community_garden",
        label: "Community Garden",
        pinIcon: PinCommunityGarden,
        pinImage: require("../assets/pins/png/pin_community_garden.png"),
        icon: IconCommunityGarden,
        color: "#6BBF6D",
    },
    {
        type: "pantry",
        label: "Pantry",
        pinIcon: PinPantry,
        pinImage: require("../assets/pins/png/pin_pantry.png"),
        icon: IconPantry,
        color: "#6C91F6",
    },
    {
        type: "other",
        label: "Other",
        pinIcon: PinOther,
        pinImage: require("../assets/pins/png/pin_other.png"),
        icon: IconOther,
        color: "#888780",
    },
    {
        type: "temporary",
        label: "Temporary",
        pinIcon: PinTemporary,
        pinImage: require("../assets/pins/png/pin_temporary.png"),
        icon: IconOther,
        color: "#888780",
    },
];

export const PIN_CATEGORY_MAP = Object.fromEntries(
    PIN_CATEGORIES.map((c) => [c.type, c]),
) as Record<PinType, PinCategory>;
