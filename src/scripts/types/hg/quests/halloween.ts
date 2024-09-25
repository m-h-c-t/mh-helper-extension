import {z} from "zod";

export const questHalloweenBoilingCauldronSchema = z.object({
    reward_track: z.object({
        is_complete: z.union([z.literal(true), z.literal(null)]),
    }),
});

export type QuestHalloweenBoilingCauldron = z.infer<typeof questHalloweenBoilingCauldronSchema>;
