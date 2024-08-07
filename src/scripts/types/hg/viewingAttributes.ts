
export interface FieryWarpathViewingAttributes {
    desert_warpath: {
        wave: number | "portal"
    }
}
export interface SeasonalGardenViewingAttributes {
    season: 'sg' | 'sr' | 'fl' | 'wr'
}

export type ViewingAttributes = FieryWarpathViewingAttributes |
    SeasonalGardenViewingAttributes |
    Record<string, never>;
