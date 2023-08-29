export interface QuestRelicHunter {
    maps: RelicHunterMap[];
    default_map_id: number;
}

interface RelicHunterMap {
    map_id: number | string;
    name: string;
    map_class: 'treaure' | 'event' | 'poster';
}
