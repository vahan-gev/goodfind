import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    Bookmark,
    CalendarDays,
    Clock,
    Copy,
    ExternalLink,
    Flag,
    MapPinned,
    Plus,
    ShieldBan,
    Tag,
    Trash2,
    User,
    X,
} from "lucide-react-native";
import { useAuth } from "@clerk/expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PIN_CATEGORY_MAP, type PinType } from "../constants/pinCategories";
import type { Doc } from "../../convex/_generated/dataModel";

const DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
] as const;
const DAY_LABELS: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
};
const FLAG_REASONS = ["spam", "outdated", "inaccurate", "other"] as const;
const FLAG_REASON_LABELS: Record<string, string> = {
    spam: "Spam",
    outdated: "Outdated",
    inaccurate: "Inaccurate",
    other: "Other",
};

interface Props {
    pin: Doc<"pins"> | null;
    visible: boolean;
    onClose: () => void;
}

export function PinDetailModal({ pin, visible, onClose }: Props) {
    const { isSignedIn } = useAuth();
    const currentUser = useQuery(
        api.users.currentUser,
        isSignedIn ? {} : "skip",
    );
    const deals = useQuery(
        api.deals.listByPin,
        pin ? { pinId: pin._id } : "skip",
    );
    const pinOwner = useQuery(
        api.users.getById,
        pin ? { userId: pin.ownerId } : "skip",
    );
    const ownerPinCount = useQuery(
        api.users.getPinCount,
        pin ? { userId: pin.ownerId } : "skip",
    );

    const toggleSave = useMutation(api.users.toggleSavePin);
    const removePin = useMutation(api.pins.remove);
    const createDeal = useMutation(api.deals.create);
    const flagMutation = useMutation(api.flags.createFlag);
    const toggleBlock = useMutation(api.users.toggleBlockUser);

    const [authorModalVisible, setAuthorModalVisible] = useState(false);
    const [dealModalVisible, setDealModalVisible] = useState(false);
    const [flagModalVisible, setFlagModalVisible] = useState(false);

    const [dealTitle, setDealTitle] = useState("");
    const [dealDesc, setDealDesc] = useState("");
    const [dealDay, setDealDay] = useState<(typeof DAYS)[number]>("monday");
    const [dealStart, setDealStart] = useState("");
    const [dealEnd, setDealEnd] = useState("");
    const [dealSubmitting, setDealSubmitting] = useState(false);

    const [flagReason, setFlagReason] =
        useState<(typeof FLAG_REASONS)[number]>("spam");
    const [flagNote, setFlagNote] = useState("");
    const [flagSubmitting, setFlagSubmitting] = useState(false);

    const isSaved = useMemo(() => {
        if (!currentUser || !pin) return false;
        return currentUser.savedPins.includes(pin._id);
    }, [currentUser, pin]);

    const isOwner = useMemo(() => {
        if (!currentUser || !pin) return false;
        return pin.ownerId === currentUser._id;
    }, [currentUser, pin]);

    const alreadyFlagged = useMemo(() => {
        if (!currentUser || !pin) return false;
        return pin.flaggedByUsers.includes(currentUser._id);
    }, [currentUser, pin]);

    const isBlocked = useMemo(() => {
        if (!currentUser || !pin) return false;
        return (currentUser.blockedUsers ?? []).includes(pin.ownerId);
    }, [currentUser, pin]);

    if (!pin) return null;

    const cat = PIN_CATEGORY_MAP[pin.type as PinType];
    const Icon = cat.icon;

    const copyAddress = () => {
        if (!pin.address) return;
        Clipboard.setString(pin.address);
        Alert.alert("Copied", "Address copied to clipboard");
    };

    const openInMaps = () => {
        if (!pin.address && !pin.coordinates) return;
        const addr = encodeURIComponent(pin.address || "");
        const { latitude, longitude } = pin.coordinates;

        if (Platform.OS === "ios") {
            Alert.alert("Open in Maps", "Choose a maps app", [
                {
                    text: "Apple Maps",
                    onPress: () =>
                        Linking.openURL(
                            pin.address
                                ? `maps:?q=${addr}`
                                : `maps:?ll=${latitude},${longitude}`,
                        ),
                },
                {
                    text: "Google Maps",
                    onPress: () =>
                        Linking.openURL(
                            pin.address
                                ? `https://www.google.com/maps/search/?api=1&query=${addr}`
                                : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
                        ),
                },
                { text: "Cancel", style: "cancel" },
            ]);
        } else {
            Linking.openURL(
                pin.address
                    ? `https://www.google.com/maps/search/?api=1&query=${addr}`
                    : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
            );
        }
    };

    const handleToggleSave = async () => {
        try {
            await toggleSave({ pinId: pin._id });
        } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed");
        }
    };

    const handleDelete = () => {
        Alert.alert("Delete Pin", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await removePin({ pinId: pin._id });
                        onClose();
                    } catch (e: any) {
                        Alert.alert("Error", e.message ?? "Failed");
                    }
                },
            },
        ]);
    };

    const handleSubmitDeal = async () => {
        if (
            !dealTitle.trim() ||
            !dealDesc.trim() ||
            !dealStart.trim() ||
            !dealEnd.trim()
        )
            return;
        setDealSubmitting(true);
        try {
            await createDeal({
                pinId: pin._id,
                title: dealTitle.trim(),
                description: dealDesc.trim(),
                schedule: {
                    days: dealDay,
                    startTime: dealStart.trim(),
                    endTime: dealEnd.trim(),
                    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
                },
            });
            setDealTitle("");
            setDealDesc("");
            setDealDay("monday");
            setDealStart("");
            setDealEnd("");
            setDealModalVisible(false);
        } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed");
        } finally {
            setDealSubmitting(false);
        }
    };

    const handleSubmitFlag = async () => {
        setFlagSubmitting(true);
        try {
            await flagMutation({
                targetId: pin._id,
                targetType: "pin",
                reason: flagReason,
                note: flagNote.trim(),
            });
            setFlagReason("spam");
            setFlagNote("");
            setFlagModalVisible(false);
            Alert.alert(
                "Reported",
                "Thank you for helping keep the community safe.",
            );
        } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed");
        } finally {
            setFlagSubmitting(false);
        }
    };

    const handleToggleBlock = async () => {
        if (!pin) return;
        const action = isBlocked ? "Unblock" : "Block";
        Alert.alert(
            `${action} User`,
            `Are you sure you want to ${action.toLowerCase()} this user?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: action,
                    style: isBlocked ? "default" : "destructive",
                    onPress: async () => {
                        try {
                            await toggleBlock({ userId: pin.ownerId });
                            setAuthorModalVisible(false);
                            if (!isBlocked) onClose();
                        } catch (e: any) {
                            Alert.alert("Error", e.message ?? "Failed");
                        }
                    },
                },
            ],
        );
    };

    const canSubmitDeal =
        dealTitle.trim() &&
        dealDesc.trim() &&
        dealStart.trim() &&
        dealEnd.trim();

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={onClose}
            >
                <View style={s.container}>
                    <View style={s.header}>
                        <Text style={s.headerTitle}>Pin Details</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={s.closeBtn}
                            activeOpacity={0.6}
                        >
                            <X size={22} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        contentContainerStyle={s.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Pin header */}
                        <View style={s.pinHeader}>
                            <View
                                style={[
                                    s.iconCircle,
                                    { backgroundColor: cat.color + "18" },
                                ]}
                            >
                                <Icon width={28} height={28} />
                            </View>
                            <View style={s.pinHeaderText}>
                                <Text style={s.pinName}>{pin.name}</Text>
                                <View
                                    style={[
                                        s.badge,
                                        { backgroundColor: cat.color + "18" },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            s.badgeText,
                                            { color: cat.color },
                                        ]}
                                    >
                                        {cat.label}
                                    </Text>
                                </View>
                            </View>
                            {isSignedIn && (
                                <TouchableOpacity
                                    onPress={handleToggleSave}
                                    style={s.actionCircle}
                                    activeOpacity={0.6}
                                >
                                    <Bookmark
                                        size={22}
                                        color={isSaved ? "#4F46E5" : "#999"}
                                        fill={isSaved ? "#4F46E5" : "none"}
                                        strokeWidth={2}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={s.description}>{pin.description}</Text>

                        {/* Address */}
                        {pin.address ? (
                            <View style={s.addressCard}>
                                <MapPinned size={16} color="#888" />
                                <Text style={s.addressText} numberOfLines={2}>
                                    {pin.address}
                                </Text>
                                <TouchableOpacity
                                    onPress={copyAddress}
                                    style={s.addressAction}
                                    activeOpacity={0.6}
                                >
                                    <Copy size={16} color="#4F46E5" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={openInMaps}
                                    style={s.addressAction}
                                    activeOpacity={0.6}
                                >
                                    <ExternalLink size={16} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        {/* Author */}
                        <TouchableOpacity
                            style={s.authorRow}
                            onPress={() => setAuthorModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            {pinOwner?.avatarUrl ? (
                                <Image
                                    source={{ uri: pinOwner.avatarUrl }}
                                    style={s.authorAvatar}
                                />
                            ) : (
                                <View style={s.authorAvatarPlaceholder}>
                                    <User size={16} color="#fff" />
                                </View>
                            )}
                            <Text style={s.authorName}>
                                {pinOwner?.displayName ?? "Loading..."}
                            </Text>
                            <Text style={s.authorHint}>View profile</Text>
                        </TouchableOpacity>

                        {/* Actions */}
                        {isSignedIn && (
                            <View style={s.actionRow}>
                                {!alreadyFlagged && !isOwner && (
                                    <TouchableOpacity
                                        style={s.flagBtn}
                                        onPress={() =>
                                            setFlagModalVisible(true)
                                        }
                                        activeOpacity={0.7}
                                    >
                                        <Flag size={14} color="#F59E0B" />
                                        <Text style={s.flagBtnText}>
                                            Report
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {alreadyFlagged && (
                                    <View style={s.flaggedBadge}>
                                        <Flag size={13} color="#aaa" />
                                        <Text style={s.flaggedText}>
                                            Reported
                                        </Text>
                                    </View>
                                )}
                                {isOwner && (
                                    <TouchableOpacity
                                        style={s.deleteBtn}
                                        onPress={handleDelete}
                                        activeOpacity={0.7}
                                    >
                                        <Trash2 size={14} color="#DC2626" />
                                        <Text style={s.deleteBtnText}>
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Deals */}
                        <View style={s.sectionHeader}>
                            <Tag size={16} color="#4F46E5" />
                            <Text style={s.sectionTitle}>Deals</Text>
                            {isSignedIn && (
                                <TouchableOpacity
                                    onPress={() => setDealModalVisible(true)}
                                    style={s.addDealBtn}
                                    activeOpacity={0.7}
                                >
                                    <Plus size={16} color="#4F46E5" />
                                    <Text style={s.addDealBtnText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {deals && deals.length > 0 ? (
                            deals.map((deal) => (
                                <View key={deal._id} style={s.dealCard}>
                                    <Text style={s.dealTitle}>
                                        {deal.title}
                                    </Text>
                                    <Text style={s.dealDesc}>
                                        {deal.description}
                                    </Text>
                                    <View style={s.dealMeta}>
                                        <View style={s.dealMetaItem}>
                                            <CalendarDays
                                                size={13}
                                                color="#888"
                                            />
                                            <Text style={s.dealMetaText}>
                                                {DAY_LABELS[
                                                    deal.schedule.days
                                                ] ?? deal.schedule.days}
                                            </Text>
                                        </View>
                                        <View style={s.dealMetaItem}>
                                            <Clock size={13} color="#888" />
                                            <Text style={s.dealMetaText}>
                                                {deal.schedule.startTime} –{" "}
                                                {deal.schedule.endTime}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={s.emptyDeals}>
                                No deals yet — be the first to add one!
                            </Text>
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* ── Author Profile Modal ── */}
            <Modal
                visible={authorModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setAuthorModalVisible(false)}
            >
                <View style={s.container}>
                    <View style={s.header}>
                        <Text style={s.headerTitle}>User Profile</Text>
                        <TouchableOpacity
                            onPress={() => setAuthorModalVisible(false)}
                            style={s.closeBtn}
                            activeOpacity={0.6}
                        >
                            <X size={22} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <View style={s.profileBody}>
                        {pinOwner?.avatarUrl ? (
                            <Image
                                source={{ uri: pinOwner.avatarUrl }}
                                style={s.profileAvatar}
                            />
                        ) : (
                            <View style={s.profileAvatarPlaceholder}>
                                <User size={32} color="#fff" />
                            </View>
                        )}
                        <Text style={s.profileName}>
                            {pinOwner?.displayName ?? "User"}
                        </Text>
                        {pinOwner?.email ? (
                            <Text style={s.profileEmail}>{pinOwner.email}</Text>
                        ) : null}
                        <View style={s.profileStat}>
                            <Text style={s.profileStatNum}>
                                {ownerPinCount ?? 0}
                            </Text>
                            <Text style={s.profileStatLabel}>Pins Created</Text>
                        </View>
                        {isSignedIn && !isOwner && (
                            <TouchableOpacity
                                style={[
                                    s.blockBtn,
                                    isBlocked && s.blockBtnActive,
                                ]}
                                onPress={handleToggleBlock}
                                activeOpacity={0.7}
                            >
                                <ShieldBan
                                    size={18}
                                    color={isBlocked ? "#fff" : "#DC2626"}
                                />
                                <Text
                                    style={[
                                        s.blockBtnText,
                                        isBlocked && s.blockBtnTextActive,
                                    ]}
                                >
                                    {isBlocked ? "Unblock User" : "Block User"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── Deal Modal ── */}
            <Modal
                visible={dealModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setDealModalVisible(false)}
            >
                <View style={s.container}>
                    <View style={s.header}>
                        <Text style={s.headerTitle}>New Deal</Text>
                        <TouchableOpacity
                            onPress={() => setDealModalVisible(false)}
                            style={s.closeBtn}
                            activeOpacity={0.6}
                        >
                            <X size={22} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        contentContainerStyle={s.formBody}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={s.label}>Title</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. 50% off organic produce"
                            placeholderTextColor="#aaa"
                            value={dealTitle}
                            onChangeText={setDealTitle}
                        />
                        <Text style={s.label}>Description</Text>
                        <TextInput
                            style={[s.input, s.textArea]}
                            placeholder="Details..."
                            placeholderTextColor="#aaa"
                            value={dealDesc}
                            onChangeText={setDealDesc}
                            multiline
                        />
                        <Text style={s.label}>Day of Week</Text>
                        <View style={s.chipRow}>
                            {DAYS.map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[
                                        s.chip,
                                        dealDay === d && s.chipActive,
                                    ]}
                                    onPress={() => setDealDay(d)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            s.chipText,
                                            dealDay === d && s.chipTextActive,
                                        ]}
                                    >
                                        {DAY_LABELS[d]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={s.timeRow}>
                            <View style={s.timeField}>
                                <Text style={s.label}>Start</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="9:00 AM"
                                    placeholderTextColor="#aaa"
                                    value={dealStart}
                                    onChangeText={setDealStart}
                                />
                            </View>
                            <View style={s.timeField}>
                                <Text style={s.label}>End</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="5:00 PM"
                                    placeholderTextColor="#aaa"
                                    value={dealEnd}
                                    onChangeText={setDealEnd}
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[
                                s.submitBtn,
                                !canSubmitDeal && s.submitBtnDisabled,
                            ]}
                            onPress={handleSubmitDeal}
                            disabled={!canSubmitDeal || dealSubmitting}
                            activeOpacity={0.8}
                        >
                            {dealSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.submitBtnText}>Add Deal</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* ── Flag Modal ── */}
            <Modal
                visible={flagModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setFlagModalVisible(false)}
            >
                <View style={s.container}>
                    <View style={s.header}>
                        <Text style={s.headerTitle}>Report Pin</Text>
                        <TouchableOpacity
                            onPress={() => setFlagModalVisible(false)}
                            style={s.closeBtn}
                            activeOpacity={0.6}
                        >
                            <X size={22} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <View style={s.formBody}>
                        <Text style={s.label}>Reason</Text>
                        <View style={s.chipRow}>
                            {FLAG_REASONS.map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    style={[
                                        s.chip,
                                        flagReason === r && s.chipFlagActive,
                                    ]}
                                    onPress={() => setFlagReason(r)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            s.chipText,
                                            flagReason === r &&
                                                s.chipTextActive,
                                        ]}
                                    >
                                        {FLAG_REASON_LABELS[r]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={s.label}>
                            Note <Text style={s.optional}>(optional)</Text>
                        </Text>
                        <TextInput
                            style={[s.input, s.textArea]}
                            placeholder="Any additional details..."
                            placeholderTextColor="#aaa"
                            value={flagNote}
                            onChangeText={setFlagNote}
                            multiline
                        />
                        <TouchableOpacity
                            style={s.flagSubmitBtn}
                            onPress={handleSubmitFlag}
                            disabled={flagSubmitting}
                            activeOpacity={0.8}
                        >
                            {flagSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.submitBtnText}>
                                    Submit Report
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
    },
    body: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },
    formBody: { paddingHorizontal: 24, paddingTop: 12 },

    /* Pin header */
    pinHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 16,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
    },
    pinHeaderText: { flex: 1 },
    pinName: { fontSize: 20, fontWeight: "700", color: "#111" },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 4,
    },
    badgeText: { fontSize: 12, fontWeight: "600" },
    actionCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
    },
    description: {
        fontSize: 15,
        color: "#444",
        lineHeight: 22,
        marginBottom: 14,
    },

    /* Address */
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    addressText: { flex: 1, fontSize: 14, color: "#555", lineHeight: 20 },
    addressAction: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
    },

    /* Author */
    authorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    authorAvatar: { width: 36, height: 36, borderRadius: 18 },
    authorAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#4F46E5",
        justifyContent: "center",
        alignItems: "center",
    },
    authorName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#222" },
    authorHint: { fontSize: 12, color: "#4F46E5", fontWeight: "500" },

    /* Actions */
    actionRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
    flagBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#F59E0B",
        backgroundColor: "#FFFBEB",
    },
    flagBtnText: { color: "#B45309", fontSize: 13, fontWeight: "600" },
    flaggedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#f5f5f5",
    },
    flaggedText: { color: "#aaa", fontSize: 13, fontWeight: "500" },
    deleteBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#DC2626",
        backgroundColor: "#FEF2F2",
    },
    deleteBtnText: { color: "#DC2626", fontSize: 13, fontWeight: "600" },

    /* Deals */
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
        paddingTop: 16,
    },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111", flex: 1 },
    addDealBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#EEF2FF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addDealBtnText: { color: "#4F46E5", fontWeight: "600", fontSize: 13 },
    dealCard: {
        backgroundColor: "#FAFAFA",
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    dealTitle: { fontSize: 15, fontWeight: "700", color: "#222" },
    dealDesc: { fontSize: 14, color: "#555", marginTop: 4, lineHeight: 20 },
    dealMeta: { flexDirection: "row", gap: 16, marginTop: 10 },
    dealMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    dealMetaText: { fontSize: 12, color: "#888" },
    emptyDeals: {
        fontSize: 14,
        color: "#aaa",
        textAlign: "center",
        paddingVertical: 20,
    },

    /* Shared form */
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginTop: 8,
        marginBottom: 4,
    },
    optional: { fontWeight: "400", color: "#aaa" },
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
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
    },
    chipActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
    chipFlagActive: { backgroundColor: "#F59E0B", borderColor: "#F59E0B" },
    chipText: { fontSize: 13, color: "#555", fontWeight: "500" },
    chipTextActive: { color: "#fff", fontWeight: "700" },
    timeRow: { flexDirection: "row", gap: 12 },
    timeField: { flex: 1 },
    submitBtn: {
        backgroundColor: "#4F46E5",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 16,
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    flagSubmitBtn: {
        backgroundColor: "#F59E0B",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 20,
    },

    /* Author profile */
    profileBody: {
        alignItems: "center",
        paddingTop: 40,
        paddingHorizontal: 32,
        gap: 10,
    },
    profileAvatar: { width: 88, height: 88, borderRadius: 44 },
    profileAvatarPlaceholder: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#4F46E5",
        justifyContent: "center",
        alignItems: "center",
    },
    profileName: { fontSize: 22, fontWeight: "700", color: "#111" },
    profileEmail: { fontSize: 14, color: "#666" },
    profileStat: { alignItems: "center", marginTop: 12 },
    profileStatNum: { fontSize: 24, fontWeight: "700", color: "#111" },
    profileStatLabel: { fontSize: 13, color: "#888", marginTop: 2 },
    blockBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 24,
        borderWidth: 1,
        borderColor: "#DC2626",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 28,
    },
    blockBtnActive: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
    blockBtnText: { fontSize: 16, fontWeight: "600", color: "#DC2626" },
    blockBtnTextActive: { color: "#fff" },
});
