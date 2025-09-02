import {z} from "zod";

export const ValourRiftStates = ['farming', 'tower'] as const;
export const valourRiftStatesSchema = z.enum(ValourRiftStates);

const farmingSchema = z.object({
});

const towerSchema = z.object({
    floor: z.coerce.number(),
    is_eclipse_mode: z.boolean().or(z.null()),
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
