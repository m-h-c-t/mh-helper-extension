import {z} from "zod";

export const fieryWarpathViewingAttributesSchema = z.object({
    desert_warpath: z.object({
        wave: z.union([z.coerce.number(), z.literal('portal')]),
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

export const viewingAttributesSchema = z.union([
    fieryWarpathViewingAttributesSchema,
    seasonalGardenViewingAttributesSchema,
    z.object({}),
]);

export type SeasonalGardenViewingAttributes = z.infer<typeof seasonalGardenViewingAttributesSchema>;
export type FieryWarpathViewingAttributes = z.infer<typeof fieryWarpathViewingAttributesSchema>;
export type ViewingAttributes = z.infer<typeof viewingAttributesSchema>;
