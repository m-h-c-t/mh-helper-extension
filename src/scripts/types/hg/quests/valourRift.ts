import {z} from "zod";

export const ValourRiftStates = ['farming', 'tower'] as const;
const valourRiftStatesSchema = z.enum(ValourRiftStates);

const valourRiftFarmingEnvironmentAttributesSchema = z.object({
    phase: z.literal('farming'),
});

const valourRiftTowerEnvironmentAttributesSchema = z.object({
    phase: z.literal('tower'),
    active_augmentations: z.object({
        hr: z.boolean().optional(),
        sr: z.boolean().optional(),
        ss: z.boolean().optional(),
        tu: z.boolean().optional(),
        sste: z.boolean().optional(),
    }),
});

export const valourRiftEnvironmentAttributesSchema = z.union([valourRiftFarmingEnvironmentAttributesSchema, valourRiftTowerEnvironmentAttributesSchema]);

export const questRiftValourSchema = z.object({
    state: z.string(),
    floor: z.coerce.number(),
});

export type ValourRiftState = z.infer<typeof valourRiftStatesSchema>;
export type ValourRiftEnvironmentAttributes = z.infer<typeof valourRiftEnvironmentAttributesSchema>;
export type QuestRiftValour = z.infer<typeof questRiftValourSchema>;
