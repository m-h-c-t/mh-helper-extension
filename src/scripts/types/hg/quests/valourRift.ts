import {z} from "zod";

export const ValourRiftStates = ['farming', 'tower'] as const;
export const valourRiftStatesSchema = z.enum(ValourRiftStates);

const farmingSchema = z.object({
});

const towerSchema = z.object({
    floor: z.coerce.number(),
    active_augmentations: z.object({
        hr: z.boolean(),
        sr: z.boolean(),
        ss: z.boolean(),
        tu: z.boolean(),
        er: z.boolean(),
        sste: z.boolean(),
    }).partial(),
});

export const questRiftValourSchema = z.discriminatedUnion('state', [
    z.object({
        state: z.literal('farming'),
        ...farmingSchema.shape,
    }),
    z.object({
        state: z.literal('tower'),
        ...towerSchema.shape
    })
]);

export type ValourRiftState = z.infer<typeof valourRiftStatesSchema>;
export type QuestRiftValour = z.infer<typeof questRiftValourSchema>;
