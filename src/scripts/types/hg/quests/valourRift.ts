export interface QuestRiftValour {
    state: string
    floor: number
}

export const ValourRiftStates = ['farming', 'tower'] as const;

export type ValourRiftState = typeof ValourRiftStates[number];

export type ValourRiftEnvironmentAttributes = ValourRiftFarmingEnvironmentAttributes | ValourRiftTowerEnvironmentAttributes;

interface ValourRiftFarmingEnvironmentAttributes {
    phase: 'farming'
}

interface ValourRiftTowerEnvironmentAttributes {
    phase: 'tower'
    active_augmentations: {
        hr?: boolean
        sr?: boolean
        ss?: boolean
        tu?: boolean
        sste?: boolean
    }
}
