import { useCallback, useEffect, useState } from "react";
import { useSSO } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
    const { startSSOFlow } = useSSO();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);

    const signIn = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const redirectUrl = Linking.createURL("sso-callback");
            const { createdSessionId, setActive, signUp } =
                await startSSOFlow({
                    strategy: "oauth_google",
                    redirectUrl,
                });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
            } else if (signUp && signUp.createdSessionId && setActive) {
                await setActive({ session: signUp.createdSessionId });
            }
        } catch (err: any) {
            const msg =
                err.errors?.[0]?.longMessage ?? err.message ?? "Sign in failed";
            if (!msg.includes("cancel")) {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }, [startSSOFlow]);

    return { signIn, loading, error };
}
