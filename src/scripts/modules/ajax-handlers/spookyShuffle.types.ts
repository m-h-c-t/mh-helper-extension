import { hgResponseSchema } from '@scripts/types/hg';
import z from 'zod';

const TitleRanges = [
    'novice_journeyman',
    'master_lord',
    'baron_duke',
    'grand_duke_plus',
] as const;

const titleRangeSchema = z.enum(TitleRanges);

export type TitleRange = z.infer<typeof titleRangeSchema>;

// knowns cards have most field filled in except is_matched
const knownCardSchema = z.object({
    name: z.string(),
    is_revealed: z.literal(true),
    quantity: z.coerce.number(),
    is_matched: z.union([z.literal(true), z.literal(null)]),
});

// unknown cards have all null fields
const unknownCardSchema = z.object({
    name: z.literal(null),
    is_revealed: z.literal(null),
    quantity: z.literal(null),
    is_matched: z.literal(null),
});

// cards can be either known or unknown but will always have an numeric id
const cardSchema = z.object({
    id: z.coerce.number(),
}).and(z.discriminatedUnion('is_revealed', [knownCardSchema, unknownCardSchema]));

const rewardTierSchema = z.object({
    type: titleRangeSchema,
    name: z.string(), // A readable/nice english string of the title range
});

const spookyShuffleStatusSchema = z.object({
    is_complete: z.boolean().nullable(),
    is_upgraded: z.boolean().nullable(),
    has_selected_testing_pair: z.boolean(),
    reward_tiers: z.array(rewardTierSchema),
    title_range: titleRangeSchema,
    cards: z.array(cardSchema),
});

export type SpookyShuffleStatus = z.infer<typeof spookyShuffleStatusSchema>;

export const spookyShuffleResponseSchema = hgResponseSchema.extend({
    memory_game: spookyShuffleStatusSchema,
});

export type SpookyShuffleResponse = z.infer<typeof spookyShuffleResponseSchema>;
