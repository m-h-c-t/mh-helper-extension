import {z} from "zod";

export const fieryWarpathViewingAttributesSchema = z.object({
    desert_warpath: z.object({
        wave: z.union([z.coerce.number(), z.literal('portal')]),
        streak_quantity: z.coerce.number(),
        streak_type: z.string(),
        mice: z.record(z.string(), z.object({
            status: z.string(),
            quantity: z.coerce.number(),
        })),
        has_support_mice: z.union([z.literal('active'), z.string()]),
        morale_percent: z.coerce.number(),
        show_portal: z.string(),
    }),
});

export const seasonalGardenViewingAttributesSchema = z.object({
    season: z.union([
        z.literal('sg'),
        z.literal('sr'),
        z.literal('fl'),
        z.literal('wr'),
    ]),
});

export const zugzwangsTowerViewingAttributesSchema = z.object({
    zzt_amplifier: z.coerce.number(),
    zzt_max_amplifier: z.coerce.number(),
    zzt_tech_progress: z.coerce.number(),
    zzt_mage_progress: z.coerce.number(),
});

// Discriminated union that supports both specific environments and general fallback
export const viewingAttributesSchema = z.union([
    // Specific environments with typed viewing_atts
    z.object({
        environment_name: z.literal("Fiery Warpath"),
        viewing_atts: fieryWarpathViewingAttributesSchema,
    }),
    z.object({
        environment_name: z.literal("Seasonal Garden"),
        viewing_atts: seasonalGardenViewingAttributesSchema,
    }),
    z.object({
        environment_name: z.literal("Zugzwang's Tower"),
        viewing_atts: zugzwangsTowerViewingAttributesSchema,
    }),
    // Fallback for any other environment
    z.object({
        environment_name: z.string(),
        viewing_atts: z.record(z.string(), z.unknown()).optional().default({}),
    })
]);

export type FieryWarpathViewingAttributes = z.infer<typeof fieryWarpathViewingAttributesSchema>;
export type SeasonalGardenViewingAttributes = z.infer<typeof seasonalGardenViewingAttributesSchema>;
export type ZugzwangsTowerViewingAttributes = z.infer<typeof zugzwangsTowerViewingAttributesSchema>;
export type ViewingAttributes = z.infer<typeof viewingAttributesSchema>;
