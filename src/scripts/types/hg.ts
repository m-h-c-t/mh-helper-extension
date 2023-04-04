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
    sn_user_id: number;
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
    enviroment_atts?: EnvironmentAttributes;
    environment_atts?: EnvironmentAttributes;
    viewing_atts: ViewingAttributes;
}

// TODO: Define needed interfaces for quests in /types/quests/<QuestName>.ts
export interface Quests {
    QuestAncientCity?: quests.QuestAncientCity // Zokor
    QuestBalacksCove?: quests.QuestBalacksCove
    QuestBountifulBeanstalk?: quests.QuestBountifulBeanstalk
    QuestClawShotCity?: quests.QuestClawShotCity
    QuestFloatingIslands?: quests.QuestFloatingIslands
    QuestForbiddenGrove?: quests.QuestForbiddenGrove
    QuestForewordFarm?: quests.QuestForewordFarm
    QuestFortRox?: quests.QuestFortRox
    QuestHarbour?: quests.QuestHarbour
    QuestHalloweenBoilingCauldron?: quests.QuestHalloweenBoilingCauldron
    QuestIceberg?: quests.QuestIceberg;
    QuestIceFortress?: quests.QuestIceFortress;
    QuestLabyrinth?: quests.QuestLabyrinth
    QuestLivingGarden?: quests.QuestLivingGarden
    QuestLostCity?: quests.QuestLostCity
    QuestMousoleum?: quests.QuestMousoleum
    QuestMoussuPicchu?: quests.QuestMoussuPicchu
    QuestPollutionOutbreak?: quests.QuestPollutionOutbreak // Toxic Spill
    QuestQuesoGeyser?: quests.QuestQuesoGeyser
    QuestRelicHunter?: unknown
    QuestRiftBristleWoods?: quests.QuestRiftBristleWoods
    QuestRiftBurroughs?: quests.QuestRiftBurroughs
    QuestRiftFuroma?: quests.QuestRiftFuroma
    QuestRiftWhiskerWoods?: quests.QuestRiftWhiskerWoods
    QuestRiftValour?: quests.QuestRiftValour
    QuestSandDunes?: quests.QuestSandDunes
    QuestSchoolOfSorcery?: quests.QuestSchoolOfSorcery
    QuestSunkenCity?: quests.QuestSunkenCity
    QuestSuperBrieFactory?: quests.QuestSuperBrieFactory
    QuestSpringHunt?: quests.QuestSpringHunt
    QuestTableOfContents?: quests.QuestTableOfContents
    QuestTrainStation?: unknown
    QuestWinterHunt2021?: unknown
}

export type EnvironmentAttributes =
    | quests.ValourRiftEnvironmentAttributes
    | Record<string, never>;

export type ViewingAttributes =
    | FieryWarpathViewingAttributes
    | SeasonalGardenViewingAttributes
    | Record<string, never>;

export interface FieryWarpathViewingAttributes {
    desert_warpath: {
        wave: number | "portal"
    }
}
export interface SeasonalGardenViewingAttributes {
    season: 'sg' | 'sr' | 'fl' | 'wr'
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

