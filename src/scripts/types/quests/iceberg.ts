export interface QuestIceberg {
    current_phase: IcebergPhase;
}

export const IcebergPhases = [
    'Treacherous Tunnels',
    'Brutal Bulwark',
    'Bombing Run',
    'The Mad Depths',
    'Icewing\'s Lair',
    'Hidden Depths',
    'The Deep Lair',
    'General',
] as const;

export type IcebergPhase = typeof IcebergPhases[number];
