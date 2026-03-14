import React from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Text } from "@react-navigation/elements";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";

interface GoogleSignInButtonProps {
    label?: string;
}

export function GoogleSignInButton({
    label = "Continue with Google",
}: GoogleSignInButtonProps) {
    const { signIn, loading, error } = useGoogleSignIn();

    return (
        <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
                style={styles.button}
                onPress={signIn}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#111" />
                ) : (
                    <>
                        <Image
                            source={{
                                uri: "https://developers.google.com/identity/images/g-logo.png",
                            }}
                            style={styles.icon}
                        />
                        <Text style={styles.text}>{label}</Text>
                    </>
                )}
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 12,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    icon: {
        width: 20,
        height: 20,
    },
    text: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    error: {
        color: "#DC2626",
        fontSize: 14,
        textAlign: "center",
    },
});
