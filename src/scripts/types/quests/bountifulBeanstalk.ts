export type QuestBountifulBeanstalk =
    | BeanstalkAttributes
    | CastleAttributes;

export type BeanstalkAttributes = {
    in_castle: false;
    beanstalk: {
        is_boss_encounter: boolean;
    };
};

export type CastleAttributes = {
    in_castle: true;
    castle: {
        is_boss_encounter: boolean;
        current_floor: {
            name: string;
        };
    };
};
