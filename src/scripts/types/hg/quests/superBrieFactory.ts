
export interface QuestSuperBrieFactory {
    factory_atts: FactoryAtts;
}

interface FactoryAtts {
    current_room: RoomType;
    boss_warning: boolean | null;
}

export type RoomType =
    | "mixing_room"
    | "break_room"
    | "pumping_room"
    | "quality_assurance_room";
