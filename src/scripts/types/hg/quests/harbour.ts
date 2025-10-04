import { z } from 'zod';

export const questHarbourSchema = z.object({
    status: z.union([z.literal('noShip'), z.literal('canBeginSearch'), z.literal('searchStarted')]),
    can_claim: z.boolean(),
    crew: z.array(z.object({
        type: z.string(),
        status: z.union([z.literal('caught'), z.literal('uncaught')]),
    })),
});

export type QuestHarbour = z.infer<typeof questHarbourSchema>;
