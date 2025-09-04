import {z} from "zod";

const blightTiers = ["tier_1", "tier_2", "tier_3", "tier_4"] as const;
const blightTierSchema = z.enum(blightTiers);

export const questAfterwordAcresSchema = z.object({
    blight_tier: blightTierSchema,
});

export type QuestAfterwordAcres = z.infer<typeof questAfterwordAcresSchema>;
