import { hgResponseSchema } from '@scripts/types/hg';
import z from 'zod';

/**
 * An item brought back back a golem
 */
const golemItemSchema = z.object({
    name: z.string(),
    quantity: z.coerce.number(),
});

type GolemItem = z.infer<typeof golemItemSchema>;

const raritySchema = z.enum(['area', 'hat', 'scarf']);
export type Rarity = z.infer<typeof raritySchema>;

/**
 * Golem Response from HG, previewed by CBS
 */
const golemRewardsSchema = z.object({
    items: z.record(raritySchema, z.array(golemItemSchema)),
});

export type GolemRewards = z.infer<typeof golemRewardsSchema>;

export const golemResponseSchema = hgResponseSchema.extend({
    golem_rewards: golemRewardsSchema,
});

export type GolemResponse = z.infer<typeof golemResponseSchema>;

/*
export interface GolemResponse {
    items: Record<Rarity, GolemItem[]>
    // bonus_items: [];
    // num_upgrade_items: number;
    // num_gilded_charms: number;
    // num_hailstones: number;
    // has_golden_shield: boolean;
    // aura: {
    //     num_hours: number;
    //     end_date: string;
    //     is_capped: boolean;
    //     cutoff_date: string
    // };
    // environment: {
    //     name: string;
    // }
    // golem: {
    //     level: number;
    // };
}
*/

/**
 * The data that will be recorded externally
 */
export interface GolemPayload {
    uid: string;
    timestamp: number;
    location: string;
    loot: (GolemItem & {
        rarity: Rarity;
    })[];
}
