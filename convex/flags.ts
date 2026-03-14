import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const createFlag = mutation({
    args: {
        targetId: v.string(),
        targetType: v.union(v.literal("pin"), v.literal("deal")),
        reason: v.union(
            v.literal("spam"),
            v.literal("outdated"),
            v.literal("inaccurate"),
            v.literal("other"),
        ),
        note: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        if (args.targetType === "pin") {
            const pinId = args.targetId as Id<"pins">;
            const pin = await ctx.db.get(pinId);
            if (!pin) throw new Error("Pin not found");
            if (pin.flaggedByUsers.includes(user._id)) {
                throw new Error("You already flagged this pin");
            }
            await ctx.db.patch(pinId, {
                flagCount: pin.flagCount + 1,
                flaggedByUsers: [...pin.flaggedByUsers, user._id],
            });
        } else if (args.targetType === "deal") {
            const dealId = args.targetId as Id<"deals">;
            const deal = await ctx.db.get(dealId);
            if (!deal) throw new Error("Deal not found");
            if (deal.flaggedByUsers.includes(user._id)) {
                throw new Error("You already flagged this deal");
            }
            await ctx.db.patch(dealId, {
                flagCount: deal.flagCount + 1,
                flaggedByUsers: [...deal.flaggedByUsers, user._id],
            });
        }

        await ctx.db.insert("flags", {
            targetType: args.targetType,
            reporterId: user._id,
            reason: args.reason,
            note: args.note,
            createdAt: Date.now(),
        });
    },
});
