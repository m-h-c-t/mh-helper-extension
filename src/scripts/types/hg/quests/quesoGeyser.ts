import { z } from 'zod';

export const QuesoGeyserStates = ['collecting', 'corked', 'eruption', 'claim'] as const;
const quesoGeyserNonCollectingStateSchema = z.enum(['corked', 'eruption', 'claim']);

export const questQuesoGeyserSchema = z.discriminatedUnion('state', [
    z.object({
        state: z.literal('collecting'),
        state_name: z.null(),
    }),
    z.object({
        state: quesoGeyserNonCollectingStateSchema,
        state_name: z.string(),
    }),
]);

export type QuesoGeyserState = typeof QuesoGeyserStates[number];
export type QuestQuesoGeyser = z.infer<typeof questQuesoGeyserSchema>;
