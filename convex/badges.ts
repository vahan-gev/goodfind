export const ALL_BADGE_IDS = [
    "first_sprout",
    "pathfinder",
    "community_pillar",
    "local_legend",
    "deal_hunter",
    "on_a_roll",
    "trusted_source",
    "market_regular",
    "giving_back",
    "good_finder",
] as const;

export async function recomputeBadges(ctx: any, userId: any) {
    const pins = await ctx.db
        .query("pins")
        .filter((q: any) => q.eq(q.field("ownerId"), userId))
        .collect();

    const deals = await ctx.db
        .query("deals")
        .filter((q: any) => q.eq(q.field("authorId"), userId))
        .collect();

    const pinCount: number = pins.length;
    const dealCount: number = deals.length;
    const earned: string[] = [];

    if (pinCount >= 1) earned.push("first_sprout");
    if (pinCount >= 5) earned.push("pathfinder");
    if (pinCount >= 10) earned.push("community_pillar");
    if (pinCount >= 25) earned.push("local_legend");
    if (dealCount >= 1) earned.push("deal_hunter");
    if (dealCount >= 5) earned.push("on_a_roll");
    if (pins.some((p: any) => p.type === "food_bank" || p.type === "pantry"))
        earned.push("giving_back");
    if (pins.some((p: any) => p.type === "farmers_market"))
        earned.push("market_regular");
    if (pinCount > 0 && pins.every((p: any) => (p.flagCount ?? 0) === 0))
        earned.push("trusted_source");

    if (pins.length > 0) {
        const pinIds = new Set(pins.map((p: any) => p._id));
        const allUsers = await ctx.db.query("users").collect();
        const saveCounts = new Map<string, number>();
        for (const u of allUsers) {
            for (const savedPin of u.savedPins) {
                if (pinIds.has(savedPin)) {
                    saveCounts.set(savedPin, (saveCounts.get(savedPin) ?? 0) + 1);
                }
            }
        }
        if ([...saveCounts.values()].some((count) => count >= 10))
            earned.push("good_finder");
    }

    await ctx.db.patch(userId, { badges: earned });
}
