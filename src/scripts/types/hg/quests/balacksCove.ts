import {z} from "zod";

export const questBalacksCoveSchema = z.object({
    tide: z.object({
        level: z.union([z.literal('low'), z.literal('med'), z.literal('high')]),
        direction: z.union([z.literal('in'), z.literal('out')]),
        percent: z.coerce.number(),
    }),
});

export type QuestBalacksCove = z.infer<typeof questBalacksCoveSchema>;
