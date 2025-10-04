import { hgResponseSchema } from '@scripts/types/hg';
import { zodStrumber } from '@scripts/util/zod';
import { z } from 'zod';

export const kingsGiveawayResultSchema = z.object({
    quantity: z.coerce.number(),
    slot: z.string(),
    items: z.array(z.object({
        name: z.string(),
        quantity: zodStrumber,
        type: z.string(),
    })),
});

export type KingsGiveawayResult = z.infer<typeof kingsGiveawayResultSchema>;

export const kingsGiveawayStatusSchema = z.object({
    remaining_openable_prize_packs: z.union([z.null(), z.coerce.number()]), // prefer null over coercing number
    vault_is_open: z.union([z.literal(true), z.null()]),
    vault_prizes: z.array(z.object({
        quantity: zodStrumber,
        type: z.string(),
        name: z.string(),
    })).or(z.array(z.never()))
});

export type KingsGiveawayStatus = z.infer<typeof kingsGiveawayStatusSchema>;

export const kingsGiveawayResponseSchema = hgResponseSchema.extend({
    kings_giveaway: kingsGiveawayStatusSchema,
    kings_giveaway_result: kingsGiveawayResultSchema,
});

export type KingsGiveawayResponse = z.infer<typeof kingsGiveawayResponseSchema>;
