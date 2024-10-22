import {z} from "zod";

export const MiceStates = [
    'no_plants',
    'one_plant',
    'two_plants',
    'three_plants',
    'three_papyrus',
    'boss',
] as const;
const miceStatesSchema = z.enum(MiceStates);

export const questForewordFarmSchema = z.object({
    mice_state: miceStatesSchema,
});

export type MiceState = z.infer<typeof miceStatesSchema>;
export type QuestForewordFarm = z.infer<typeof questForewordFarmSchema>;
