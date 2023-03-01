import * as quests from '@scripts/types/quests';

export interface HgResponse {
    user: User;
    page?: unknown;
    success: 0 | 1;
    active_turn?: boolean;
    journal_markup?: JournalMarkup[];
    inventory?: Record<string, InventoryItem>  | []
}

export interface User {
    user_id: number;
    unique_hash: string;
    num_active_turns: number;
    next_activeturn_seconds: number;
    base_name: string;
    base_item_id: number;
    weapon_name: string;
    weapon_item_id: number;
    trinket_name: string | null;
    trinket_item_id: number | null;
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

// TODO: Define needed interfaces for quests in /types/quests/<QuestName>.ts
export interface Quests {
    QuestAncientCity?: any
    QuestBalacksCove?: any
    QuestClawShotCity?: any
    QuestForbiddenGrove?: any
    QuestForewordFarm?: any
    QuestFortRox?: any
    QuestHarbour?: any
    QuestIceberg?: any
    QuestIceFortress?: quests.QuestIceFortress;
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
    QuestSuperBrieFactory?: quests.QuestSuperBrieFactory
    QuestSpringHunt?: quests.QuestSpringHunt
    QuestTableOfContents?: quests.QuestTableOfContents
    QuestTrainStation?: any
    QuestWinterHunt2021?: any
}

export interface EnvironmentAttributes {

}

export interface ViewingAttributes {

}

export interface JournalMarkup {
    render_data: RenderData;
    //publish_data: PublishData;
    //wall_actions: WallActions;
}

export interface RenderData {
    //image: Image | [];
    entry_id: number;
    mouse_type: string;
    css_class: string;
    entry_date: string;
    environment: string;
    //social_link_data: SocialLinkData;
    entry_timestamp: number;
    text: string;
}

export interface InventoryItem {
    /** HitGrab's internal number id of item */
    item_id: number;
    /** Friendly display name of item */
    name: string;
    /** Unique snake_case identifying name of item */
    type: string;
    /** Item category: bait, crafting, stat, etc... */
    // classification: Classification;
    /** Total amount of item in user inventory */
    quantity: number;
}

// export type Classification = "weapon" | "base" | "bait" | "trinket" |
//     "skin" | "crafting_item" | "stat" | "potion" | "quest" |
//     "convertible" | "collectible" | "message_item" | "torn_page"

