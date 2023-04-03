export interface QuestRiftWhiskerWoods {
    zones: Record<ZoneType, ZoneStatus>
}

export type ZoneType = 'clearing' | 'tree' | 'lagoon';

interface ZoneStatus {
    percent: number;
    level: number;
}
