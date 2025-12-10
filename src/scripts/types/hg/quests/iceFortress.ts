import { z } from 'zod';

const cannonSchema = z.object({
    is_enabled: z.boolean().nullable(),
    is_active: z.boolean().nullable(),
    just_fired: z.boolean().nullable(),
    state: z.union([z.literal('firing'), z.literal('disabled'), z.literal('holding'), z.literal('noAmmo')]),
});

export const questIceFortressSchema = z.object({
    cannons: z.object({
        snow_cannon: cannonSchema,
        cinnamon_cannon: cannonSchema,
        charm_cannon: cannonSchema,
    }),
    shield: z.object({
        is_broken: z.boolean(),
    }),
});

export type QuestIceFortress = z.infer<typeof questIceFortressSchema>;
