import {z} from 'zod';

export const CavernTypes = [
    'flame_cavern',
    'double_flame_cavern',
    'triple_flame_cavern',
    'ice_lair',
    'double_ice_lair',
    'triple_ice_lair',
    'toxic_tunnels',
    'double_toxic_tunnels',
    'triple_toxic_tunnels',
    'elemental_dragon_den',
] as const;
const cavernTypeSchema = z.enum(CavernTypes);
export type CavernType = z.infer<typeof cavernTypeSchema>;

const crucibleEnvironmentSchema = z.object({
    in_cavern: z.literal(false),
});

const cavernEnvironmentSchema = z.object({
    in_cavern: z.literal(true),
    cavern: z.object({
        type: cavernTypeSchema,
        category: z.enum(['fire', 'ice', 'poison', 'elemental']),
        loot_tier: z.object({
            current_tier: z.number(),
            tier_data: z.array(z.object({
                threshold: z.number(),
            })),
        }),
    }),
});

export const questDraconicDepthsSchema = z.discriminatedUnion('in_cavern', [
    crucibleEnvironmentSchema,
    cavernEnvironmentSchema,
]);
export type QuestDraconicDepths = z.infer<typeof questDraconicDepthsSchema>;
