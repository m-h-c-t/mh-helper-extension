import {z} from "zod";

export const questHarbourSchema = z.object({
    // There is probably one more state here for when can_claim is true
    status: z.union([z.literal('canBeginSearch'), z.literal('searchStarted'), z.string()]),
    can_claim: z.boolean(),
    crew: z.array(z.object({
        type: z.string(),
        status: z.union([z.literal('caught'), z.literal('uncaught')]),
    })),
});

export type QuestHarbour = z.infer<typeof questHarbourSchema>;
