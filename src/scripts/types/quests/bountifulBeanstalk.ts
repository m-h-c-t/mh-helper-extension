export type QuestBountifulBeanstalk =
    | BeanstalkAttributes
    | CastleAttributes;

export interface BeanstalkAttributes {
    in_castle: false;
    beanstalk: {
        is_boss_encounter: boolean;
    };
}

export interface CastleAttributes {
    in_castle: true;
    castle: {
        is_boss_chase: boolean;
        is_boss_encounter: boolean;
        current_floor: {
            type: string;
            name: string;
        };
        current_room: {
            type: string;
            name: string;
        },
        next_room: {
            type: string;
            name: string;
        },
        room_position: number;
    };
    embellishments: Embellishment[];
}

export interface Embellishment {
    type: 'golden_key' | 'golden_feather' | 'ruby_remover';
    is_active: boolean;
}
