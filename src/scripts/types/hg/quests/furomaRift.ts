export interface QuestRiftFuroma {
    view_state: string
    droid: Droid
}

export interface Droid {
    charge_level: string
}

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

export type DroidChargeLevel = typeof DroidChargeLevels[number];
