import {z} from "zod";

const cannonTypeSchema = z.enum(['snow_cannon', 'cinnamon_cannon', 'charm_cannon']);

const cannonSchema = z.object({
    is_enabled: z.boolean().nullable(),
    is_active: z.boolean().nullable(),
    just_fired: z.boolean().nullable(),
    state: z.union([z.literal('firing'), z.literal('disabled'), z.literal('holding'), z.literal('noAmmo')]),
});

export const questIceFortressSchema = z.object({
    cannons: z.record(cannonTypeSchema, cannonSchema),
    shield: z.object({
        is_broken: z.boolean(),
    }),
});

export type QuestIceFortress = z.infer<typeof questIceFortressSchema>;
