import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ThemeColors } from "./colors";

type ColorScheme = "light" | "dark";

type ThemeContextValue = {
    colors: ThemeColors;
    isDark: boolean;
    colorScheme: ColorScheme | null;
};

const ThemeContext = createContext<ThemeContextValue>({
    colors: lightColors as ThemeColors,
    isDark: false,
    colorScheme: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider
            value={{ colors, isDark, colorScheme: colorScheme ?? "light" }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
