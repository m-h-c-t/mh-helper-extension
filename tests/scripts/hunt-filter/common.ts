import {HgResponse, User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

export function getValidPreResponse(): HgResponse {
    return {
        user: {} as User, // User is not validated here so we dont need it
        page: {},
        success: 1,
        trap_image: {
            auras: {}
        }
    };
}

export function getValidPostResponse(): HgResponse {
    const post = getValidPreResponse();
    post.active_turn = true;
    return post;
}

export function getDefaultUser(): User {
    return {
        user_id: 0,
        sn_user_id: '0',
        unique_hash: 'mhct',
        num_active_turns: 0,
        next_activeturn_seconds: 0,
        base_name: 'Fake Base',
        base_item_id: 0,
        weapon_name: 'Fake Weapon',
        weapon_item_id: 0,
        trinket_name: 'Fake Charm',
        trinket_item_id: 0,
        bait_name: 'Fake Cheese',
        bait_item_id: 0,
        trap_power: 0,
        trap_power_bonus: 0,
        trap_luck: 0,
        trap_attraction_bonus: 0,
        has_shield: false,
        environment_name: 'Fake Location',
        environment_id: 0,
        // force these to null
        quests: {},
        enviroment_atts: {},
        viewing_atts: {},
    };
}

export function getDefaultIntakeMessage(): IntakeMessage {
    return {
        entry_timestamp: 0,
        entry_id: 0,
        location: {
            id: 0,
            name: 'Fake Location',
        },
        shield: false,
        total_power: 0,
        total_luck: 0,
        attraction_bonus: 0,
        stage: 'Fake Stage',
        trap: {
            id: 0,
            name: 'Fake Weapon',
        },
        base: {
            id: 0,
            name: 'Fake Weapon',
        },
        cheese: {
            id: 0,
            name: 'Fake Weapon',
        },
        charm: {
            id: 0,
            name: 'Fake Charm',
        },
        caught: 0,
        attracted: 0,
        mouse: '',
        hunt_details: {},
        loot: [],
        auras: [],
    };
}
