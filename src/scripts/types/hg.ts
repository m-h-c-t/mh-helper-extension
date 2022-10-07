export interface User {
    user_id: number;
    unique_hash: string;
    base_name: string;
    base_item_id: string;
    weapon_name: string;
    weapon_item_id: string;
    trinket_name: string;
    trinket_item_id: string;
    bait_name: string;
    bait_item_id: number;
    trap_power: number;
    trap_power_bonus: number;
    trap_luck: number;
    trap_attraction_bonus: number;
    has_shield: boolean;
    environment_name: string;
    environment_id: number;
    quests: Quests;
    enviroment_atts: EnvironmentAttributes;
    environment_atts?: EnvironmentAttributes;
    viewing_atts: ViewingAttributes;
}

// TODO: Define needed interfaces for quests
interface Quests {
    QuestAncientCity?: any
    QuestBalacksCove?: any
    QuestClawShotCity?: any
    QuestForbiddenGrove?: any
    QuestForewordFarm?: any
    QuestFortRox?: any
    QuestHarbour?: any
    QuestIceberg?: any
    QuestLabyrinth?: any
    QuestLivingGarden?: any
    QuestLostCity?: any
    QuestMousoleum?: any
    QuestMoussuPicchu?: any
    QuestPollutionOutbreak?: any
    QuestQuesoGeyser?: any
    QuestRiftBristleWoods?: any
    QuestRiftBurroughs?: any
    QuestRiftFuroma?: any
    QuestRiftWhiskerWoods?: any
    QuestSandDunes?: any
    QuestSunkenCity?: any
    QuestSuperBrieFactory?: any
    QuestTableOfContents?: TableOfContentsQuest
    QuestTrainStation?: any
    QuestWinterHunt2021?: any
}

type EnvironmentAttributes = any;

type ViewingAttributes = any;

interface TableOfContentsQuest {
    is_writing: boolean,
    current_book: {
        volume: number
    }
}
