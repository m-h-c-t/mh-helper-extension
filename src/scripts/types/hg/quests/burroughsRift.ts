export interface QuestRiftBurroughs {
    mist_tier: string // MistTier
}

export const MistTiers = ['tier_0', 'tier_1', 'tier_2', 'tier_3'] as const;

export type MistTier = typeof MistTiers[number];
