import { hgResponseSchema } from '@scripts/types/hg';
import z from 'zod';

// #region Vending Machine Schema

const vendingMachineItemSchema = z.object({
    name: z.string(),
    quantity: z.number(),
    is_epic: z.boolean().nullable(),
    // thumb: z.string(),
});

const vendingMachinePurchaseTypeSchema = z.enum([
    'larry_starter_mix_snack_pack',
    'tribal_crunch_snack_pack',
    'wild_west_ranch_rings_snack_pack',
    'sandy_bert_bites_snack_pack',
    'hollow_heights_party_pack_snack_pack',
    'riftios_snack_pack',
    'story_seeds_snack_pack',
    'fantasy_fizz_snack_pack',
]);

export type VendingMachinePurchaseType = z.infer<typeof vendingMachinePurchaseTypeSchema>;

const vendingMachinePurchaseSchema = z.object({
    quantity: z.number(),
    type: vendingMachinePurchaseTypeSchema,
    items: z.array(vendingMachineItemSchema),
});

export type VendingMachinePurchase = z.infer<typeof vendingMachinePurchaseSchema>;

export const vendingMachineResponseSchema = hgResponseSchema.extend({
    vending_machine_purchase: vendingMachinePurchaseSchema,
});

export type VendingMachineReponse = z.infer<typeof vendingMachineResponseSchema>;

// #endregion Vending Machine Schema

// #region Cheesy Pipe Party Schema

const regionEnum = z.enum([
    'gnawnia',
    'valour',
    'whisker_woods',
    'burroughs',
    'furoma',
    'bristle_woods',
    'tribal_isles',
    'varmint_valley',
    'desert',
    'rodentia',
    'queso_canyon',
    'zokor_zone',
    'folklore_forest',
    'riftopia',
]);

export type Region = z.infer<typeof regionEnum>;

const regionSchema = z.object({
    type: regionEnum,
    name: z.string(),
});

const baseTileDataSchema = z.object({
    has_prize: z.boolean(),
    prize_quantity: z.coerce.number(),
    is_prize_unlocked: z.boolean(),
});

const otherTileDataSchema = baseTileDataSchema.extend({
    has_prize: z.literal(false),
    prize_name: z.string().refine(val => val === ''),
    prize_quantity: z.coerce.number().refine(val => val === 0),
});

const prizeTileDataSchema = baseTileDataSchema.extend({
    has_prize: z.literal(true),
});

const hiddenPrizeTileDataSchema = prizeTileDataSchema.extend({
    has_prize: z.literal(true),
    prize_name: z.string().refine(val => val === ''),
    is_prize_unlocked: z.literal(false),
});

const revealedPrizeTileDataSchema = baseTileDataSchema.extend({
    has_prize: z.literal(true),
    prize_name: z.string().refine(val => val.length > 0),
    is_prize_unlocked: z.literal(true),
});

const tileDataSchema = otherTileDataSchema.or(
    z.discriminatedUnion('is_prize_unlocked', [
        hiddenPrizeTileDataSchema,
        revealedPrizeTileDataSchema,
    ],
    )
);

const rowItemSchema = z.object({
    tile_data: tileDataSchema,
});

const gameBoardRowSchema = z.object({
    row_data: z.array(rowItemSchema),
});

const cheesyPipePartyGameSchema = z.object({
    game_active: z.boolean(),
    game_upgraded: z.boolean(),
    game_board: z.array(gameBoardRowSchema),
    regions: z.array(regionSchema),
    selected_region: regionEnum,
    num_prizes: z.coerce.number(),
});

export const cheesyPipePartyResponseSchema = hgResponseSchema.extend({
    cheesy_pipe_party_game: cheesyPipePartyGameSchema,
});

export type CheesyPipePartyGame = z.infer<typeof cheesyPipePartyGameSchema>;

export type CheesyPipePartyResponse = z.infer<typeof cheesyPipePartyResponseSchema>;

// #endregion Cheesy Pipe Party Schema
