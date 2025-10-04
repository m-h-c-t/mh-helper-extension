import { z } from 'zod';

const sandDunesSchema = z.object({
    is_normal: z.literal(true),
    minigame: z.object({
        has_stampede: z.boolean(),
    }),
});

const sandCryptsSchema = z.object({
    is_normal: z.literal(false),
    minigame: z.object({
        type: z.literal('grubling'),
        salt_charms_used: z.coerce.number(),
    })
});

export const questSandDunesSchema = z.discriminatedUnion('is_normal', [
    sandDunesSchema,
    sandCryptsSchema,
]);

export type QuestSandDunes = z.infer<typeof questSandDunesSchema>;
