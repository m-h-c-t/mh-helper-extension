import {z} from "zod";

export const DroidChargeLevels = [
    'charge_level_one',
    'charge_level_two',
    'charge_level_three',
    'charge_level_four',
    'charge_level_five',
    'charge_level_six',
    'charge_level_seven',
    'charge_level_eight',
    'charge_level_nine',
    'charge_level_ten',
] as const;
const droidChargeLevelSchema = z.enum(DroidChargeLevels);

export const questRiftFuromaSchema = z.object({
    view_state: z.string(),
    droid: z.object({
        charge_level: droidChargeLevelSchema,
    }),
});

export type DroidChargeLevel = z.infer<typeof droidChargeLevelSchema>;
export type QuestRiftFuroma = z.infer<typeof questRiftFuromaSchema>;
