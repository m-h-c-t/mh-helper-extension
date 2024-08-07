export interface QuestForewordFarm {
    mice_state: string // MiceState
}

export const MiceStates = [
    'no_plants',
    'one_plant',
    'two_plants',
    'three_plants',
    'three_papyrus',
    'boss',
] as const;

export type MiceState = typeof MiceStates[number];
