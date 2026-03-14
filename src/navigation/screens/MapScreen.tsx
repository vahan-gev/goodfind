import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, {
    LatLng,
    LongPressEvent,
    Marker,
    Region,
} from "react-native-maps";
import * as Location from "expo-location";
import { LocateFixed, MapPin, Search, X } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation, useRoute } from "@react-navigation/native";
import BottomSheet, {
    BottomSheetScrollView,
    BottomSheetTextInput,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useAuth } from "@clerk/expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GoogleSignInButton } from "../../components/GoogleSignInButton";
import { PinDetailModal } from "../../components/PinDetailModal";
import {
    PIN_CATEGORIES,
    PIN_CATEGORY_MAP,
    type PinType,
} from "../../constants/pinCategories";
import type { Doc } from "../../../convex/_generated/dataModel";

export function MapScreen() {
    const mapRef = useRef<MapView>(null);
    const navigation = useNavigation();
    const route = useRoute<any>();
    const [initialRegion, setInitialRegion] = useState<Region | null>(null);
    const latestLocation = useRef<{
        latitude: number;
        longitude: number;
    } | null>(null);

    const [pendingPin, setPendingPin] = useState<LatLng | null>(null);
    const addSheetRef = useRef<BottomSheet>(null);
    const [selectedType, setSelectedType] = useState<PinType | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [selectedPin, setSelectedPin] = useState<Doc<"pins"> | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    const { isSignedIn } = useAuth();
    const pins = useQuery(api.pins.list);
    const createPin = useMutation(api.pins.create);
    const currentUser = useQuery(
        api.users.currentUser,
        isSignedIn ? {} : "skip",
    );

    const filteredPins = useMemo(() => {
        if (!pins) return [];
        let result = pins;
        const blocked = currentUser?.blockedUsers ?? [];
        if (blocked.length) {
            result = result.filter((p) => !blocked.includes(p.ownerId));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.address?.toLowerCase().includes(q) ||
                    p.type.replace("_", " ").includes(q),
            );
        }
        return result;
    }, [pins, currentUser, searchQuery]);

    useEffect(() => {
        let sub: Location.LocationSubscription | null = null;
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const loc = await Location.getCurrentPositionAsync({});
            const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };
            latestLocation.current = coords;
            setInitialRegion({
                ...coords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
            sub = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 1 },
                (u) => {
                    latestLocation.current = {
                        latitude: u.coords.latitude,
                        longitude: u.coords.longitude,
                    };
                },
            );
        })();
        return () => {
            sub?.remove();
        };
    }, []);

    useEffect(() => {
        const params = route.params as any;
        if (!params?.focusCoordinates) return;
        const { latitude, longitude } = params.focusCoordinates;
        mapRef.current?.animateToRegion(
            { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
            600,
        );
    }, [(route.params as any)?.focusTimestamp]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            const query = searchQuery.trim();
            if (!query || !pins) return;

            const q = query.toLowerCase();
            const blocked = currentUser?.blockedUsers ?? [];
            const results = pins
                .filter((p) => !blocked.includes(p.ownerId))
                .filter(
                    (p) =>
                        p.name.toLowerCase().includes(q) ||
                        p.address?.toLowerCase().includes(q) ||
                        p.type.replace("_", " ").includes(q),
                );

            if (results.length === 0) {
                if (latestLocation.current) {
                    mapRef.current?.animateToRegion(
                        {
                            ...latestLocation.current,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        },
                        500,
                    );
                }
                return;
            }

            const userLoc = latestLocation.current;
            let target = results[0];
            if (userLoc) {
                let minDist = Infinity;
                for (const pin of results) {
                    const dlat =
                        pin.coordinates.latitude - userLoc.latitude;
                    const dlng =
                        pin.coordinates.longitude - userLoc.longitude;
                    const d = dlat * dlat + dlng * dlng;
                    if (d < minDist) {
                        minDist = d;
                        target = pin;
                    }
                }
            }

            mapRef.current?.animateToRegion(
                {
                    ...target.coordinates,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                500,
            );
        }, 600);
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [searchQuery, pins, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

    const reverseGeocode = useCallback(async (coords: LatLng) => {
        try {
            const results = await Location.reverseGeocodeAsync(coords);
            if (results.length > 0) {
                const r = results[0];
                const parts = [
                    r.streetNumber,
                    r.street,
                    r.city,
                    r.region,
                    r.postalCode,
                ].filter(Boolean);
                if (parts.length > 0) setAddress(parts.join(", "));
            }
        } catch {}
    }, []);

    const resetAddForm = useCallback(() => {
        setSelectedType(null);
        setName("");
        setDescription("");
        setAddress("");
        setPendingPin(null);
    }, []);

    const recenter = () => {
        if (!latestLocation.current) return;
        mapRef.current?.animateToRegion(
            {
                ...latestLocation.current,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            },
            500,
        );
    };

    const handleMapPress = useCallback(() => {
        Keyboard.dismiss();
        addSheetRef.current?.close();
    }, []);

    const handleLongPress = (event: LongPressEvent) => {
        Keyboard.dismiss();
        addSheetRef.current?.close();
        const { coordinate } = event.nativeEvent;
        setPendingPin(coordinate);
        reverseGeocode(coordinate);
        setTimeout(() => {
            addSheetRef.current?.expand();
        }, 300);
    };

    const handleMarkerPress = useCallback(
        (pin: Doc<"pins">) => {
            Keyboard.dismiss();
            addSheetRef.current?.close();
            resetAddForm();
            setSelectedPin(pin);
            setDetailVisible(true);
        },
        [resetAddForm],
    );

    const handleSubmitPin = async () => {
        if (!selectedType || !name.trim() || !description.trim() || !pendingPin)
            return;
        setSubmitting(true);
        try {
            await createPin({
                type: selectedType,
                name: name.trim(),
                description: description.trim(),
                coordinates: {
                    latitude: pendingPin.latitude,
                    longitude: pendingPin.longitude,
                },
                address: address.trim(),
                isPublic: true,
            });
            addSheetRef.current?.close();
            setSearchQuery("")
            setSearchFocused(false);
            resetAddForm();
        } catch (err: any) {
            Alert.alert("Error", err.message ?? "Failed to create pin");
        } finally {
            setSubmitting(false);
        }
    };

    const SelectedPinIcon = selectedType
        ? PIN_CATEGORY_MAP[selectedType].pinIcon
        : PIN_CATEGORY_MAP["other"].pinIcon;
    const canSubmitPin =
        selectedType && name.trim().length > 0 && description.trim().length > 0;

    if (!initialRegion) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation
                initialRegion={initialRegion}
                onLongPress={handleLongPress}
                onPress={handleMapPress}
            >
                {filteredPins.map((pin) => {
                    const cat = PIN_CATEGORY_MAP[pin.type as PinType];
                    const PIcon = cat.pinIcon;
                    return (
                        <Marker
                            key={pin._id}
                            coordinate={pin.coordinates}
                            anchor={{ x: 0.5, y: 1 }}
                            onPress={() => handleMarkerPress(pin)}
                        >
                            <PIcon width={70} />
                        </Marker>
                    );
                })}
                {pendingPin && (
                    <Marker coordinate={pendingPin} anchor={{ x: 0.5, y: 1 }}>
                        <SelectedPinIcon width={40} height={46} />
                    </Marker>
                )}
            </MapView>

            <View style={styles.searchContainer}>
                <View
                    style={[
                        styles.searchBar,
                        searchFocused && styles.searchBarFocused,
                    ]}
                >
                    <Search size={18} color="#888" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search pins..."
                        placeholderTextColor="#aaa"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery("")}
                            activeOpacity={0.6}
                        >
                            <X size={18} color="#888" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.recenterButton}
                onPress={recenter}
                activeOpacity={0.7}
            >
                <LocateFixed size={24} color="#007AFF" />
            </TouchableOpacity>

            <BottomSheet
                ref={addSheetRef}
                index={-1}
                snapPoints={["60%", "90%"]}
                enablePanDownToClose
                onClose={resetAddForm}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                {isSignedIn ? (
                    <BottomSheetScrollView
                        contentContainerStyle={styles.formContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.formTitle}>Add a Pin</Text>
                        <Text style={styles.formSubtitle}>
                            Share a food resource with the community
                        </Text>

                        <Text style={styles.label}>Category</Text>
                        <View style={styles.categoryRow}>
                            {PIN_CATEGORIES.map((cat) => {
                                const isSelected = selectedType === cat.type;
                                const CatIcon = cat.icon;
                                return (
                                    <TouchableOpacity
                                        key={cat.type}
                                        style={[
                                            styles.categoryChip,
                                            isSelected && {
                                                backgroundColor:
                                                    cat.color + "18",
                                                borderColor: cat.color,
                                            },
                                        ]}
                                        onPress={() =>
                                            setSelectedType(cat.type)
                                        }
                                        activeOpacity={0.7}
                                    >
                                        <CatIcon width={20} height={20} />
                                        <Text
                                            style={[
                                                styles.categoryLabel,
                                                isSelected && {
                                                    color: cat.color,
                                                    fontWeight: "700",
                                                },
                                            ]}
                                        >
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.label}>Name</Text>
                        <BottomSheetTextInput
                            style={styles.input}
                            placeholder="e.g. Downtown Food Pantry"
                            placeholderTextColor="#aaa"
                            value={name}
                            onChangeText={setName}
                        />
                        <Text style={styles.label}>Description</Text>
                        <BottomSheetTextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Hours, what's available, any details..."
                            placeholderTextColor="#aaa"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                        <Text style={styles.label}>Address</Text>
                        <BottomSheetTextInput
                            style={styles.input}
                            placeholder="Auto-filled from location"
                            placeholderTextColor="#aaa"
                            value={address}
                            onChangeText={setAddress}
                        />

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                !canSubmitPin && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmitPin}
                            disabled={!canSubmitPin || submitting}
                            activeOpacity={0.8}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    Add Pin
                                </Text>
                            )}
                        </TouchableOpacity>
                    </BottomSheetScrollView>
                ) : (
                    <BottomSheetView style={styles.sheetSignIn}>
                        <View style={styles.sheetIconCircle}>
                            <MapPin
                                size={28}
                                color="#4F46E5"
                                strokeWidth={2.5}
                            />
                        </View>
                        <Text style={styles.sheetSignInTitle}>Add a Pin</Text>
                        <Text style={styles.sheetSignInSubtitle}>
                            Sign in to share food resources with your community
                        </Text>
                        <View style={styles.sheetButtonWrapper}>
                            <GoogleSignInButton label="Sign in with Google" />
                        </View>
                    </BottomSheetView>
                )}
            </BottomSheet>

            <PinDetailModal
                pin={selectedPin}
                visible={detailVisible}
                onClose={() => {
                    setDetailVisible(false);
                    setSelectedPin(null);
                }}
                onViewProfile={(userId) => {
                    setDetailVisible(false);
                    setSelectedPin(null);
                    (navigation as any).navigate("UserProfile", { userId });
                }}
            />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: "100%", height: "100%" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },

    searchContainer: { position: "absolute", top: 60, left: 16, right: 16 },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#fff",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    searchBarFocused: { borderWidth: 1.5, borderColor: "#4F46E5" },
    searchInput: { flex: 1, fontSize: 15, color: "#111", paddingVertical: 0 },

    recenterButton: {
        position: "absolute",
        bottom: 24,
        right: 16,
        backgroundColor: "#fff",
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    formContainer: { paddingHorizontal: 24, paddingBottom: 48, gap: 6 },
    formTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111",
        textAlign: "center",
    },
    formSubtitle: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginTop: 8,
        marginBottom: 4,
    },
    categoryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        paddingVertical: 4,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: "#e0e0e0",
        backgroundColor: "#fafafa",
    },
    categoryLabel: { fontSize: 13, color: "#555", fontWeight: "500" },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#111",
        backgroundColor: "#fafafa",
    },
    textArea: { minHeight: 72, textAlignVertical: "top" },
    submitButton: {
        backgroundColor: "#4F46E5",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 16,
    },
    submitButtonDisabled: { opacity: 0.45 },
    submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

    sheetSignIn: {
        alignItems: "center",
        paddingHorizontal: 32,
        paddingTop: 8,
        paddingBottom: 24,
        gap: 10,
    },
    sheetIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    sheetSignInTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111",
        textAlign: "center",
    },
    sheetSignInSubtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 8,
    },
    sheetButtonWrapper: { width: "100%" },
});
