export interface QuestPollutionOutbreak {
    titles: Record<PollutionTitle, PollutionTitleStatus>
}

export const PollutionTitles = [
    'hero',
    'knight',
    'lord_lady',
    'baron_baroness',
    'count_countess',
    'duke_dutchess',
    'grand_duke',
    'archduke_archduchess',
] as const;

export type PollutionTitle = typeof PollutionTitles[number];

export interface PollutionTitleStatus {
    active: boolean
}
