import React, { useMemo } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "@react-navigation/elements";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import { useTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";

interface GoogleSignInButtonProps {
    label?: string;
}

export function GoogleSignInButton({
    label = "Continue with Google",
}: GoogleSignInButtonProps) {
    const { signIn, loading, error } = useGoogleSignIn();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
                style={styles.button}
                onPress={signIn}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.icon} />
                ) : (
                    <>
                        <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
                            <Image
                                source={{
                                    uri: "https://developers.google.com/identity/images/g-logo.png",
                                }}
                                style={styles.icon}
                            />
                        </View>
                        <Text style={styles.text}>{label}</Text>
                    </>
                )}
            </TouchableOpacity>
        </>
    );
}

function createStyles(colors: ThemeColors) {
    return StyleSheet.create({
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 12,
        width: "100%",
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconWrapper: {
        padding: 4,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    icon: {
        width: 20,
        height: 20,
    },
    text: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textTertiary,
    },
    error: {
        color: colors.destructive,
        fontSize: 14,
        textAlign: "center",
    },
});
}
