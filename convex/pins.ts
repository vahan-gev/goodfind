import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { recomputeBadges } from "./badges";

const pinType = v.union(
    v.literal("food_bank"),
    v.literal("grocery"),
    v.literal("farmers_market"),
    v.literal("community_garden"),
    v.literal("pantry"),
    v.literal("other"),
);

export const create = mutation({
    args: {
        type: pinType,
        name: v.string(),
        description: v.string(),
        coordinates: v.object({
            latitude: v.number(),
            longitude: v.number(),
        }),
        address: v.string(),
        isPublic: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const now = Date.now();
        const pinId = await ctx.db.insert("pins", {
            ownerId: user._id,
            type: args.type,
            name: args.name,
            description: args.description,
            coordinates: args.coordinates,
            address: args.address,
            isPublic: args.isPublic,
            deals: [],
            flagCount: 0,
            flaggedByUsers: [],
            createdAt: now,
            updatedAt: now,
        });
        await recomputeBadges(ctx, user._id);
        return pinId;
    },
});

export const remove = mutation({
    args: { pinId: v.id("pins") },
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
        if (pin.ownerId !== user._id) throw new Error("Not the owner");

        for (const dealId of pin.deals) {
            await ctx.db.delete(dealId);
        }

        const allUsers = await ctx.db.query("users").collect();
        for (const u of allUsers) {
            if (u.savedPins.includes(args.pinId)) {
                await ctx.db.patch(u._id, {
                    savedPins: u.savedPins.filter((id) => id !== args.pinId),
                });
            }
        }

        await ctx.db.delete(args.pinId);
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("pins")
            .filter((q) => q.eq(q.field("isPublic"), true))
            .order("desc")
            .collect();
    },
});

export const getById = query({
    args: { pinId: v.id("pins") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.pinId);
    },
});

export const getByIds = query({
    args: { pinIds: v.array(v.id("pins")) },
    handler: async (ctx, args) => {
        const results = await Promise.all(
            args.pinIds.map((id) => ctx.db.get(id)),
        );
        return results.filter(Boolean);
    },
});
