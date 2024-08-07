import {z} from "zod";

export const MistTiers = ['tier_0', 'tier_1', 'tier_2', 'tier_3'] as const;
const mistTierSchema = z.enum(MistTiers);

export const questRiftBurroughsSchema = z.object({
    mist_tier: mistTierSchema,
});

export type MistTier = typeof MistTiers[number];
export type QuestRiftBurroughs = z.infer<typeof questRiftBurroughsSchema>;
