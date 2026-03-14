import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        displayName: v.string(),
        email: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        bio: v.optional(v.string()),
        savedPins: v.array(v.id("pins")),
        blockedUsers: v.optional(v.array(v.id("users"))),
        createdAt: v.number(),
    }).index("by_clerk_id", ["clerkId"]),
    pins: defineTable({
        ownerId: v.id("users"),
        type: v.union(
            v.literal("food_bank"),
            v.literal("grocery"),
            v.literal("farmers_market"),
            v.literal("community_garden"),
            v.literal("pantry"),
            v.literal("other"),
        ),
        name: v.string(),
        deals: v.array(v.id("deals")),
        description: v.string(),
        coordinates: v.object({
            latitude: v.number(),
            longitude: v.number(),
        }),
        address: v.string(),
        isPublic: v.boolean(),
        flagCount: v.number(),
        flaggedByUsers: v.array(v.id("users")),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    deals: defineTable({
        pinId: v.id("pins"),
        authorId: v.id("users"),
        title: v.string(),
        description: v.string(),
        schedule: v.object({
            days: v.optional(
                v.array(
                    v.union(
                        v.literal("monday"),
                        v.literal("tuesday"),
                        v.literal("wednesday"),
                        v.literal("thursday"),
                        v.literal("friday"),
                        v.literal("saturday"),
                        v.literal("sunday"),
                    ),
                ),
            ),
            expiresAt: v.optional(v.number()),
        }),
        flagCount: v.number(),
        flaggedByUsers: v.array(v.id("users")),
        upvotes: v.array(v.id("users")),
        createdAt: v.number(),
    }),

    flags: defineTable({
        targetType: v.union(v.literal("deal"), v.literal("pin")),
        reporterId: v.id("users"),
        reason: v.union(
            v.literal("spam"),
            v.literal("outdated"),
            v.literal("inaccurate"),
            v.literal("other"),
        ),
        note: v.string(),
        createdAt: v.number(),
    }),
});
