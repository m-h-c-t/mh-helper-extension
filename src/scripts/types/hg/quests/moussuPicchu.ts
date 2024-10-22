import {z} from "zod";

const elementIndicatorSchema = z.object({
    level: z.union([
        z.literal('none'),
        z.literal('low'),
        z.literal('medium'),
        z.literal('high'),
        z.literal('max'),
    ]),
});

export const questMoussuPicchuSchema = z.object({
    elements: z.object({
        wind: elementIndicatorSchema,
        rain: elementIndicatorSchema,
        storm: elementIndicatorSchema,
    }),
});

export type QuestMoussuPicchu = z.infer<typeof questMoussuPicchuSchema>;
