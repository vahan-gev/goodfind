import PinFoodBank from "../assets/pins/pin_food_bank.svg";
import PinGrocery from "../assets/pins/pin_grocery.svg";
import PinFarmersMarket from "../assets/pins/pin_farmers_market.svg";
import PinCommunityGarden from "../assets/pins/pin_community_garden.svg";
import PinPantry from "../assets/pins/pin_pantry.svg";
import PinOther from "../assets/pins/pin_other.svg";

import IconFoodBank from "../assets/icons/icon_food_bank.svg";
import IconGrocery from "../assets/icons/icon_grocery.svg";
import IconFarmersMarket from "../assets/icons/icon_farmers_market.svg";
import IconCommunityGarden from "../assets/icons/icon_community_garden.svg";
import IconPantry from "../assets/icons/icon_pantry.svg";
import IconOther from "../assets/icons/icon_other.svg";

import type { SvgProps } from "react-native-svg";
import type { FC } from "react";

export type PinType =
    | "food_bank"
    | "grocery"
    | "farmers_market"
    | "community_garden"
    | "pantry"
    | "other";

export interface PinCategory {
    type: PinType;
    label: string;
    /** Map marker SVG */
    pinIcon: FC<SvgProps>;
    /** UI icon SVG (modals, cards, chips) */
    icon: FC<SvgProps>;
    color: string;
}

export const PIN_CATEGORIES: PinCategory[] = [
    { type: "food_bank", label: "Food Bank", pinIcon: PinFoodBank, icon: IconFoodBank, color: "#E74C3C" },
    { type: "grocery", label: "Grocery", pinIcon: PinGrocery, icon: IconGrocery, color: "#3498DB" },
    { type: "farmers_market", label: "Farmers Market", pinIcon: PinFarmersMarket, icon: IconFarmersMarket, color: "#27AE60" },
    { type: "community_garden", label: "Community Garden", pinIcon: PinCommunityGarden, icon: IconCommunityGarden, color: "#2ECC71" },
    { type: "pantry", label: "Pantry", pinIcon: PinPantry, icon: IconPantry, color: "#F39C12" },
    { type: "other", label: "Other", pinIcon: PinOther, icon: IconOther, color: "#9B59B6" },
];

export const PIN_CATEGORY_MAP = Object.fromEntries(
    PIN_CATEGORIES.map((c) => [c.type, c]),
) as Record<PinType, PinCategory>;
