import z from "zod";
import {hgResponseSchema} from "@scripts/types/hg";

const vendingMachineItemSchema = z.object({
    name: z.string(),
    quantity: z.number(),
    is_epic: z.boolean().nullable(),
    // thumb: z.string(),
});

const vendingMachinePurchaseTypeSchema = z.enum([
    "larry_starter_mix_snack_pack",
    "tribal_crunch_snack_pack",
    "wild_west_ranch_rings_snack_pack",
    "sandy_bert_bites_snack_pack",
    "hollow_heights_party_pack_snack_pack",
    "riftios_snack_pack",
    "story_seeds_snack_pack",
    "fantasy_fizz_snack_pack",
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
