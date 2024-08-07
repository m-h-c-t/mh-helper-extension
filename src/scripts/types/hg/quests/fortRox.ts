export interface QuestFortRox {
    is_day: true | null
    is_night: true | null
    is_dawn: true | null
    is_lair: true | null
    current_stage: string | null // FortRoxStage
}

export const FortRoxStages = [ 'stage_one', 'stage_two', 'stage_three', 'stage_four', 'stage_five' ] as const;

export type FortRoxStage = typeof FortRoxStages[number];
