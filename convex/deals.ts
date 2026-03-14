import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const dayOfWeek = v.union(
    v.literal("monday"),
    v.literal("tuesday"),
    v.literal("wednesday"),
    v.literal("thursday"),
    v.literal("friday"),
    v.literal("saturday"),
    v.literal("sunday"),
);

export const create = mutation({
    args: {
        pinId: v.id("pins"),
        title: v.string(),
        description: v.string(),
        days: v.optional(v.array(dayOfWeek)),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const pin = await ctx.db.get(args.pinId);
        if (!pin) throw new Error("Pin not found");

        const schedule: { days?: typeof args.days; expiresAt?: number } = {};
        if (args.days && args.days.length > 0) schedule.days = args.days;
        if (args.expiresAt) schedule.expiresAt = args.expiresAt;

        const dealId = await ctx.db.insert("deals", {
            pinId: args.pinId,
            authorId: user._id,
            title: args.title,
            description: args.description,
            schedule,
            flagCount: 0,
            flaggedByUsers: [],
            upvotes: [],
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.pinId, {
            deals: [...pin.deals, dealId],
            updatedAt: Date.now(),
        });

        return dealId;
    },
});

export const listByPin = query({
    args: { pinId: v.id("pins") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const allDeals = await ctx.db
            .query("deals")
            .filter((q) => q.eq(q.field("pinId"), args.pinId))
            .order("desc")
            .collect();
        return allDeals.filter((d) => !d.schedule?.expiresAt || d.schedule.expiresAt > now);
    },
});
