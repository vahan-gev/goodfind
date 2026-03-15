import React, { useMemo, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
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
    ChevronLeft,
    Copy,
    ExternalLink,
    Flag,
    MapPinned,
    Plus,
    Tag,
    Timer,
    Trash2,
    User,
    X,
} from "lucide-react-native";
import { useAuth } from "@clerk/expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PIN_CATEGORY_MAP, type PinType } from "../constants/pinCategories";
import type { Doc, Id } from "../../convex/_generated/dataModel";

const DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
] as const;
type Day = (typeof DAYS)[number];
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

const EXPIRY_OPTIONS = [
    { label: "None", value: 0 },
    { label: "1 week", value: 7 * 24 * 60 * 60 * 1000 },
    { label: "2 weeks", value: 14 * 24 * 60 * 60 * 1000 },
    { label: "1 month", value: 30 * 24 * 60 * 60 * 1000 },
    { label: "3 months", value: 90 * 24 * 60 * 60 * 1000 },
];

function formatDaysLabel(days?: Day[]): string {
    if (!days || days.length === 0) return "Always";
    if (days.length === 7) return "Every day";
    return days.map((d) => DAY_LABELS[d]).join(", ");
}

type ViewState = "main" | "addDeal" | "report";
type FlagTarget = { type: "pin"; id: string } | { type: "deal"; id: string };

interface Props {
    pin: Doc<"pins"> | null;
    visible: boolean;
    onClose: () => void;
    onViewProfile?: (userId: string) => void;
}

export function PinDetailModal({
    pin,
    visible,
    onClose,
    onViewProfile,
}: Props) {
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

    const toggleSave = useMutation(api.users.toggleSavePin);
    const removePin = useMutation(api.pins.remove);
    const createDeal = useMutation(api.deals.create);
    const removeDeal = useMutation(api.deals.remove);
    const flagMutation = useMutation(api.flags.createFlag);

    const [view, setView] = useState<ViewState>("main");
    const [justReported, setJustReported] = useState(false);
    const [justReportedDealIds, setJustReportedDealIds] = useState<Set<string>>(
        new Set(),
    );
    const [flagTarget, setFlagTarget] = useState<FlagTarget | null>(null);

    const [dealTitle, setDealTitle] = useState("");
    const [dealDesc, setDealDesc] = useState("");
    const [dealDays, setDealDays] = useState<Day[]>([]);
    const [dealExpiry, setDealExpiry] = useState(0);
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

    const isReported = alreadyFlagged || justReported;
    const { colors } = useTheme();
    const st = useMemo(() => createStyles(colors), [colors]);

    if (!pin) return null;

    const cat = PIN_CATEGORY_MAP[pin.type as PinType];
    const Icon = cat.icon;

    const handleClose = () => {
        setView("main");
        setJustReported(false);
        setJustReportedDealIds(new Set());
        setFlagTarget(null);
        resetDealForm();
        onClose();
    };

    const resetDealForm = () => {
        setDealTitle("");
        setDealDesc("");
        setDealDays([]);
        setDealExpiry(0);
    };

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

    const handleDeleteDeal = (dealId: Id<"deals">) => {
        Alert.alert("Delete Deal", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await removeDeal({ dealId });
                    } catch (e: any) {
                        Alert.alert("Error", e.message ?? "Failed");
                    }
                },
            },
        ]);
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
                        handleClose();
                    } catch (e: any) {
                        Alert.alert("Error", e.message ?? "Failed");
                    }
                },
            },
        ]);
    };

    const toggleDay = (day: Day) => {
        setDealDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
        );
    };

    const canSubmitDeal = dealTitle.trim() && dealDesc.trim();

    const handleSubmitDeal = async () => {
        if (!canSubmitDeal) return;
        setDealSubmitting(true);
        try {
            const args: any = {
                pinId: pin._id,
                title: dealTitle.trim(),
                description: dealDesc.trim(),
            };
            if (dealDays.length > 0) args.days = dealDays;
            if (dealExpiry > 0) args.expiresAt = Date.now() + dealExpiry;

            await createDeal(args);
            resetDealForm();
            setView("main");
        } catch (e: any) {
            Alert.alert("Error", e.message ?? "Failed");
        } finally {
            setDealSubmitting(false);
        }
    };

    const handleSubmitFlag = async () => {
        if (!flagNote.trim() || !flagTarget) return;
        setFlagSubmitting(true);
        try {
            await flagMutation({
                targetId: flagTarget.id,
                targetType: flagTarget.type,
                reason: flagReason,
                note: flagNote.trim(),
            });
            setFlagReason("spam");
            setFlagNote("");
            if (flagTarget.type === "pin") setJustReported(true);
            else
                setJustReportedDealIds(
                    (prev) => new Set([...prev, flagTarget.id]),
                );
            setFlagTarget(null);
            setView("main");
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

    const headerTitle =
        view === "addDeal"
            ? "Add Deal"
            : view === "report"
              ? flagTarget?.type === "deal"
                  ? "Report Deal"
                  : "Report Pin"
              : "Pin Details";

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={st.container}>
                <View style={st.header}>
                    {view !== "main" ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (view === "addDeal") resetDealForm();
                                if (view === "report") setFlagTarget(null);
                                setView("main");
                            }}
                            style={st.headerSideBtn}
                            activeOpacity={0.6}
                        >
                            <ChevronLeft size={24} color={colors.icon} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 36 }} />
                    )}
                    <Text style={st.headerTitle}>{headerTitle}</Text>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={st.headerSideBtn}
                        activeOpacity={0.6}
                    >
                        <X size={22} color={colors.textCaption} />
                    </TouchableOpacity>
                </View>

                {view === "main" && (
                    <ScrollView
                        contentContainerStyle={st.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={st.pinHeader}>
                            <View
                                style={[
                                    st.iconCircle,
                                    { backgroundColor: cat.color + "18" },
                                ]}
                            >
                                <Icon width={28} height={28} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={st.pinName}>{pin.name}</Text>
                                <View
                                    style={[
                                        st.badge,
                                        { backgroundColor: cat.color + "18" },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            st.badgeText,
                                            { color: cat.color },
                                        ]}
                                    >
                                        {cat.label}
                                    </Text>
                                </View>
                            </View>
                            {isSignedIn && (
                                <View style={st.actionRow}>
                                    {!isOwner &&
                                        (isReported ? (
                                            <View style={st.actionCircle}>
                                                <Flag size={22} color={colors.textDisabled} />
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={st.actionCircle}
                                                onPress={() => {
                                                    setFlagTarget({
                                                        type: "pin",
                                                        id: pin._id,
                                                    });
                                                    setView("report");
                                                }}
                                                activeOpacity={0.6}
                                            >
                                                <Flag
                                                    size={22}
                                                    color={colors.accent}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    {isOwner && (
                                        <TouchableOpacity
                                            style={st.actionCircle}
                                            onPress={handleDelete}
                                            activeOpacity={0.6}
                                        >
                                            <Trash2 size={22} color={colors.destructive} />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={handleToggleSave}
                                        style={st.actionCircle}
                                        activeOpacity={0.6}
                                    >
                                        <Bookmark
                                            size={22}
                                            color={isSaved ? colors.primary : colors.textDisabled}
                                            fill={isSaved ? colors.primary : "none"}
                                            strokeWidth={2}
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <Text style={st.description}>{pin.description}</Text>

                        {pin.address ? (
                            <View style={st.addressCard}>
                                <MapPinned size={16} color={colors.iconMuted} />
                                <Text style={st.addressText} numberOfLines={2}>
                                    {pin.address}
                                </Text>
                                <TouchableOpacity
                                    onPress={copyAddress}
                                    style={st.addressAction}
                                    activeOpacity={0.6}
                                >
                                    <Copy size={16} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={openInMaps}
                                    style={st.addressAction}
                                    activeOpacity={0.6}
                                >
                                    <ExternalLink size={16} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={st.authorRow}
                            onPress={() => {
                                if (onViewProfile) {
                                    handleClose();
                                    onViewProfile(pin.ownerId);
                                }
                            }}
                            activeOpacity={onViewProfile ? 0.7 : 1}
                        >
                            {pinOwner?.avatarUrl ? (
                                <Image
                                    source={{ uri: pinOwner.avatarUrl }}
                                    style={st.authorAvatar}
                                />
                            ) : (
                                <View style={st.authorAvatarPlaceholder}>
                                    <User size={16} color={colors.onPrimary} />
                                </View>
                            )}
                            <Text style={st.authorName}>
                                {pinOwner?.displayName ?? "Loading..."}
                            </Text>
                            <Text style={st.authorHint}>View profile</Text>
                        </TouchableOpacity>

                        <View style={st.sectionHeader}>
                            <Tag size={16} color={colors.primary} />
                            <Text style={st.sectionTitle}>Deals</Text>
                            {isSignedIn && (
                                <TouchableOpacity
                                    onPress={() => setView("addDeal")}
                                    style={st.addDealBtn}
                                    activeOpacity={0.7}
                                >
                                    <Plus size={16} color={colors.primary} />
                                    <Text style={st.addDealBtnText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {deals && deals.length > 0 ? (
                            deals.map((deal) => {
                                const isDealAuthor =
                                    currentUser?._id === deal.authorId;
                                const isDealReported =
                                    (currentUser?._id &&
                                        deal.flaggedByUsers.includes(
                                            currentUser._id,
                                        )) ||
                                    justReportedDealIds.has(deal._id);
                                return (
                                    <View key={deal._id} style={st.dealCard}>
                                        <View style={st.dealAuthorRow}>
                                            {(deal as any).authorAvatarUrl ? (
                                                <Image
                                                    source={{
                                                        uri: (deal as any)
                                                            .authorAvatarUrl,
                                                    }}
                                                    style={st.dealAuthorAvatar}
                                                />
                                            ) : (
                                                <View
                                                    style={
                                                        st.dealAuthorAvatarPlaceholder
                                                    }
                                                >
                                                    <User
                                                        size={12}
                                                        color={colors.onPrimary}
                                                    />
                                                </View>
                                            )}
                                            <Text style={st.dealAuthorName}>
                                                {(deal as any)
                                                    .authorDisplayName ??
                                                    "Unknown"}
                                            </Text>
                                        </View>
                                        <View style={st.dealCardHeader}>
                                            <Text style={st.dealTitle}>
                                                {deal.title}
                                            </Text>
                                            {isSignedIn && (
                                                <View style={st.dealActions}>
                                                    {!isDealAuthor &&
                                                        (isDealReported ? (
                                                            <View
                                                                style={
                                                                    st.actionCircle
                                                                }
                                                            >
                                                                <Flag
                                                                    size={20}
                                                                    color={colors.textDisabled}
                                                                />
                                                            </View>
                                                        ) : (
                                                            <TouchableOpacity
                                                                style={
                                                                    st.actionCircle
                                                                }
                                                                onPress={() => {
                                                                    setFlagTarget(
                                                                        {
                                                                            type: "deal",
                                                                            id: deal._id,
                                                                        },
                                                                    );
                                                                    setView(
                                                                        "report",
                                                                    );
                                                                }}
                                                                activeOpacity={
                                                                    0.6
                                                                }
                                                            >
                                                                <Flag
                                                                    size={20}
                                                                    color={colors.accent}
                                                                />
                                                            </TouchableOpacity>
                                                        ))}
                                                    {isDealAuthor && (
                                                        <TouchableOpacity
                                                            style={
                                                                st.actionCircle
                                                            }
                                                            onPress={() =>
                                                                handleDeleteDeal(
                                                                    deal._id,
                                                                )
                                                            }
                                                            activeOpacity={0.6}
                                                        >
                                                            <Trash2
                                                                size={20}
                                                                color={colors.destructive}
                                                            />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>

                                        <Text style={st.dealDesc}>
                                            {deal.description}
                                        </Text>
                                        <View style={st.dealMeta}>
                                            <View style={st.dealMetaItem}>
                                                <CalendarDays
                                                    size={13}
                                                    color={colors.iconMuted}
                                                />
                                                <Text style={st.dealMetaText}>
                                                    {formatDaysLabel(
                                                        deal.schedule
                                                            ?.days as Day[],
                                                    )}
                                                </Text>
                                            </View>
                                            {deal.schedule?.expiresAt && (
                                                <View style={st.dealMetaItem}>
                                                    <Timer
                                                        size={13}
                                                        color={colors.iconMuted}
                                                    />
                                                    <Text
                                                        style={st.dealMetaText}
                                                    >
                                                        Expires{" "}
                                                        {new Date(
                                                            deal.schedule
                                                                .expiresAt,
                                                        ).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={st.emptyDeals}>
                                No deals yet, be the first to add one!
                            </Text>
                        )}
                    </ScrollView>
                )}

                {view === "addDeal" && (
                    <ScrollView
                        contentContainerStyle={st.formBody}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={st.label}>Title</Text>
                        <TextInput
                            style={st.input}
                            placeholder="e.g. 50% off organic produce"
                            placeholderTextColor={colors.textPlaceholder}
                            value={dealTitle}
                            onChangeText={setDealTitle}
                        />

                        <Text style={st.label}>Description</Text>
                        <TextInput
                            style={[st.input, st.textArea]}
                            placeholder="Details..."
                            placeholderTextColor={colors.textPlaceholder}
                            value={dealDesc}
                            onChangeText={setDealDesc}
                            multiline
                        />

                        <Text style={st.label}>
                            Days <Text style={st.hint}>(none = always)</Text>
                        </Text>
                        <View style={st.chipRow}>
                            {DAYS.map((d) => {
                                const active = dealDays.includes(d);
                                return (
                                    <TouchableOpacity
                                        key={d}
                                        style={[
                                            st.chip,
                                            active && st.chipActive,
                                        ]}
                                        onPress={() => toggleDay(d)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                st.chipText,
                                                active && st.chipTextActive,
                                            ]}
                                        >
                                            {DAY_LABELS[d]}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={st.label}>
                            Expires after{" "}
                            <Text style={st.hint}>(optional)</Text>
                        </Text>
                        <View style={st.chipRow}>
                            {EXPIRY_OPTIONS.map((opt) => {
                                const active = dealExpiry === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.label}
                                        style={[
                                            st.chip,
                                            active && st.chipActive,
                                        ]}
                                        onPress={() => setDealExpiry(opt.value)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                st.chipText,
                                                active && st.chipTextActive,
                                            ]}
                                        >
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[
                                st.submitBtn,
                                !canSubmitDeal && st.submitBtnDisabled,
                            ]}
                            onPress={handleSubmitDeal}
                            disabled={!canSubmitDeal || dealSubmitting}
                            activeOpacity={0.8}
                        >
                            {dealSubmitting ? (
                                <ActivityIndicator color={colors.onPrimary} />
                            ) : (
                                <Text style={st.submitBtnText}>Add Deal</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                )}

                {view === "report" && (
                    <ScrollView
                        contentContainerStyle={st.formBody}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={st.label}>Reason</Text>
                        <View style={st.chipRow}>
                            {FLAG_REASONS.map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    style={[
                                        st.chip,
                                        flagReason === r && st.chipFlagActive,
                                    ]}
                                    onPress={() => setFlagReason(r)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            st.chipText,
                                            flagReason === r &&
                                                st.chipTextActive,
                                        ]}
                                    >
                                        {FLAG_REASON_LABELS[r]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={st.label}>Note</Text>
                        <TextInput
                            style={[st.input, st.textArea]}
                            placeholder="Describe the issue..."
                            placeholderTextColor={colors.textPlaceholder}
                            value={flagNote}
                            onChangeText={setFlagNote}
                            multiline
                        />
                        <TouchableOpacity
                            style={[
                                st.flagSubmitBtn,
                                (!flagNote.trim() ||
                                    !flagTarget ||
                                    flagSubmitting) &&
                                    st.submitBtnDisabled,
                            ]}
                            onPress={handleSubmitFlag}
                            disabled={
                                !flagNote.trim() ||
                                !flagTarget ||
                                flagSubmitting
                            }
                            activeOpacity={0.8}
                        >
                            {flagSubmitting ? (
                                <ActivityIndicator color={colors.onPrimary} />
                            ) : (
                                <Text style={st.submitBtnText}>
                                    Submit Report
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

function createStyles(colors: ThemeColors) {
    return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorderLight,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text,
        flex: 1,
        textAlign: "center",
    },
    headerSideBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.backgroundSecondary,
        justifyContent: "center",
        alignItems: "center",
    },
    body: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },
    formBody: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48 },

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
    pinName: { fontSize: 20, fontWeight: "700", color: colors.text },
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
        backgroundColor: colors.backgroundSecondary,
        justifyContent: "center",
        alignItems: "center",
    },
    description: {
        fontSize: 15,
        color: colors.textMuted,
        lineHeight: 22,
        marginBottom: 14,
    },
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.backgroundQuaternary,
        borderWidth: 1,
        borderColor: colors.borderLighter,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    addressText: { flex: 1, fontSize: 14, color: colors.textSubtitle, lineHeight: 20 },
    addressAction: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.primaryTint,
        justifyContent: "center",
        alignItems: "center",
    },
    authorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.backgroundQuaternary,
        borderWidth: 1,
        borderColor: colors.borderLighter,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    authorAvatar: { width: 36, height: 36, borderRadius: 18 },
    authorAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    authorName: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textSecondary },
    authorHint: { fontSize: 12, color: colors.primary, fontWeight: "500" },
    actionRow: { flexDirection: "row", gap: 8 },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: colors.cardBorderLight,
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.text,
        flex: 1,
    },
    addDealBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.primaryTint,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addDealBtnText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
    dealCard: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.borderLighter,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    dealCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    dealActions: { flexDirection: "row", gap: 8 },
    dealTitle: { fontSize: 15, fontWeight: "700", color: colors.textSecondary, flex: 1 },
    dealAuthorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 6,
    },
    dealAuthorAvatar: { width: 24, height: 24, borderRadius: 12 },
    dealAuthorAvatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    dealAuthorName: { fontSize: 12, color: colors.textCaption, fontWeight: "500" },
    dealDesc: { fontSize: 14, color: colors.textSubtitle, marginTop: 6, lineHeight: 20 },
    dealMeta: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 10,
    },
    dealMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    dealMetaText: { fontSize: 12, color: colors.textPlaceholder },
    emptyDeals: {
        fontSize: 14,
        color: colors.textPlaceholder,
        textAlign: "center",
        paddingVertical: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textTertiary,
        marginTop: 12,
        marginBottom: 6,
    },
    hint: { fontWeight: "400", color: colors.textPlaceholder, fontSize: 12 },
    input: {
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
        backgroundColor: colors.inputBg,
    },
    textArea: { minHeight: 72, textAlignVertical: "top" },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        backgroundColor: colors.background,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipFlagActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: 13, color: colors.textSubtitle, fontWeight: "500" },
    chipTextActive: { color: colors.onPrimary, fontWeight: "700" },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 20,
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
    flagSubmitBtn: {
        backgroundColor: colors.accent,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 20,
    },
});
}
