import {ViewingAttributes} from "./viewingAttributes";
import {EnvironmentAttributes} from './environmentAttributes';
import {Quests} from './quests';


export interface User {
    user_id: number;
    sn_user_id: number | string;
    unique_hash: string;
    num_active_turns: number;
    next_activeturn_seconds: number;
    base_name: string;
    base_item_id: number | string;
    weapon_name: string;
    weapon_item_id: number | string;
    trinket_name: string | null;
    trinket_item_id: number | string | null;
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
