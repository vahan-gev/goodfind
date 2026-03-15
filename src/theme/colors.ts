export const lightColors = {
    background: "#fff",
    backgroundSecondary: "#F5F5F5",
    backgroundTertiary: "#FAFAFA",
    backgroundQuaternary: "#F9FAFB",

    card: "#FAFAFA",
    cardBorder: "#eee",
    cardBorderLight: "#f0f0f0",

    text: "#111",
    textSecondary: "#222",
    textTertiary: "#333",
    textMuted: "#444",
    textSubtitle: "#555",
    textCaption: "#666",
    textPlaceholder: "#888",
    textDisabled: "#999",
    textHint: "#aaa",
    textDate: "#bbb",

    border: "#e0e0e0",
    borderLight: "#e8e8e8",
    borderLighter: "#eee",
    borderInput: "#ddd",

    primary: "#2E9E6B",
    primaryTint: "#2E9E6B18",
    primaryTintLight: "#2E9E6B14",

    dealsTint: "#10B98118",
    destructive: "#DC2626",
    destructiveText: "#DC2626",
    accent: "#F59E0B",
    deals: "#10B981",
    myDeals: "#4F46E5",

    icon: "#111",
    iconMuted: "#888",
    iconPlaceholder: "#aaa",
    iconDisabled: "#ccc",

    inputBg: "#fafafa",
    inputBorder: "#ddd",

    shadow: "#000",

    onPrimary: "#fff",
} as const;

export const darkColors = {
    background: "#121212",
    backgroundSecondary: "#1E1E1E",
    backgroundTertiary: "#2A2A2A",
    backgroundQuaternary: "#252525",

    card: "#2A2A2A",
    cardBorder: "#3A3A3A",
    cardBorderLight: "#333",

    text: "#F5F5F5",
    textSecondary: "#E5E5E5",
    textTertiary: "#D4D4D4",
    textMuted: "#A3A3A3",
    textSubtitle: "#999",
    textCaption: "#888",
    textPlaceholder: "#6B6B6B",
    textDisabled: "#737373",
    textHint: "#525252",
    textDate: "#666",

    border: "#404040",
    borderLight: "#3A3A3A",
    borderLighter: "#333",
    borderInput: "#404040",

    primary: "#34C77B",
    primaryTint: "#34C77B28",
    primaryTintLight: "#34C77B20",

    dealsTint: "#34D39928",
    destructive: "#EF4444",
    destructiveText: "#F87171",
    accent: "#FBBF24",
    deals: "#34D399",
    myDeals: "#818CF8",

    icon: "#F5F5F5",
    iconMuted: "#A3A3A3",
    iconPlaceholder: "#737373",
    iconDisabled: "#525252",

    inputBg: "#1E1E1E",
    inputBorder: "#404040",

    shadow: "#000",

    onPrimary: "#fff",
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;
