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
        is_boss_encounter: boolean;
        current_floor: {
            name: string;
        };
        current_room: {
            name: string;
        }
    };
}
