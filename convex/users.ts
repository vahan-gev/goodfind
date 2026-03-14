import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { recomputeBadges } from "./badges";

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user !== null) {
            const displayName =
                identity.name || identity.email?.split("@")[0] || "User";
            const patch: Record<string, any> = {};
            if (user.displayName !== displayName) patch.displayName = displayName;
            if (user.avatarUrl !== (identity.pictureUrl ?? user.avatarUrl))
                patch.avatarUrl = identity.pictureUrl ?? user.avatarUrl;
            if (identity.email && user.email !== identity.email)
                patch.email = identity.email;
            if (Object.keys(patch).length > 0) await ctx.db.patch(user._id, patch);
            return user._id;
        }

        return await ctx.db.insert("users", {
            clerkId: identity.subject,
            displayName:
                identity.name || identity.email?.split("@")[0] || "User",
            email: identity.email,
            avatarUrl: identity.pictureUrl,
            bio: undefined,
            savedPins: [],
            blockedUsers: [],
            createdAt: Date.now(),
        });
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;
        return {
            _id: user._id,
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            badges: user.badges ?? [],
        };
    },
});

export const getPinCount = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const pins = await ctx.db
            .query("pins")
            .filter((q) => q.eq(q.field("ownerId"), args.userId))
            .collect();
        return pins.length;
    },
});

export const getDealCount = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const deals = await ctx.db
            .query("deals")
            .filter((q) => q.eq(q.field("authorId"), args.userId))
            .collect();
        return deals.length;
    },
});

export const toggleSavePin = mutation({
    args: { pinId: v.id("pins") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const isSaved = user.savedPins.includes(args.pinId);
        const updatedPins = isSaved
            ? user.savedPins.filter((id) => id !== args.pinId)
            : [...user.savedPins, args.pinId];

        await ctx.db.patch(user._id, { savedPins: updatedPins });
        const pin = await ctx.db.get(args.pinId);
        if (pin) await recomputeBadges(ctx, pin.ownerId);
        return !isSaved;
    },
});

export const toggleBlockUser = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        if (args.userId === user._id) throw new Error("Cannot block yourself");

        const blocked = user.blockedUsers ?? [];
        const isBlocked = blocked.includes(args.userId);
        const updated = isBlocked
            ? blocked.filter((id) => id !== args.userId)
            : [...blocked, args.userId];

        await ctx.db.patch(user._id, { blockedUsers: updated });
        return !isBlocked;
    },
});
