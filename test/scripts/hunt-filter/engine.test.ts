import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {ApiResponse, User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {Logger} from '@scripts/util/logger';
jest.mock('@scripts/util/logger')

// Mock logger won't actually call console.log
const logger = new Logger();
const engine = new IntakeRejectionEngine(logger);

describe('validateResponse', () => {
    let pre: ApiResponse;
    let post: ApiResponse;

    beforeEach(() => {
        pre = getValidPreResponse();
        post = getValidPostResponse();
    });

    it('passes with good responses', () => {
        expect(engine.validateResponse(pre, post)).toBe(true);
    });
    
    it('rejects when pre is unsuccessful', () => {
        pre.success = 0;
        expect(engine.validateResponse(pre, post)).toBe(false);
    });
    
    it('rejects when post is unsuccessful', () => {
        post.success = 0;
        expect(engine.validateResponse(pre, post)).toBe(false);
    });

    it('rejects when pre has no page object', () => {
        pre.page = undefined;
        expect(engine.validateResponse(pre, post)).toBe(false);
    });

    it('rejects when post active_turn is false', () => {
        post.active_turn = false;
        expect(engine.validateResponse(pre, post)).toBe(false);
    });
});

describe('validateUser', () => {
    let pre: User;
    let post: User;

    beforeEach(() => {
        pre = getDefaultUser();
        post = getDefaultUser();
    });

    it('rejects without required differences', () => {
        expect(engine.validateUser(pre, post)).toBe(false);
    });

    it('passes if user has required differences', () => {
        post.next_activeturn_seconds = 1500;
        post.num_active_turns = 1;
        expect(engine.validateUser(pre, post)).toBe(true);
    });
});

describe('validateMessage', () => {
    let pre: IntakeMessage;
    let post: IntakeMessage;

    beforeEach(() => {
        pre = getDefaultIntakeMessage();
        post = getDefaultIntakeMessage();
    });

    it('passes', () => {
        expect(engine.validateMessage(pre, post)).toBe(true);
        logger.info("one");
    });

    it('rejects different locations', () => {
        post.location!.name = "Real Location";
        expect(engine.validateMessage(pre, post)).toBe(false);
    });

    it('rejects different traps', () => {
        post.trap.name = "Real Trap";
        expect(engine.validateMessage(pre, post)).toBe(false);
    });

    it('rejects different bases', () => {
        post.base.name = "Real Base";
        expect(engine.validateMessage(pre, post)).toBe(false);
    });

    it('rejects different cheese', () => {
        post.cheese.name = "Real Cheese";
        expect(engine.validateMessage(pre, post)).toBe(false);
    });

    it('passes if both stages are undefined', () => {
        pre.stage = undefined;
        post.stage = undefined;

        expect(engine.validateMessage(pre, post)).toBe(true);
    });

    it('passes if stage is object', () => {
        pre.stage = { rain: 'Rain 99', wind: 'Wind 99' };
        post.stage = { rain: 'Rain 99', wind: 'Wind 99' };

        expect(engine.validateMessage(pre, post)).toBe(true);
    })

    it('exempts location and stage if realm ripper was caught', () => {
        pre.location!.name = "Forbidden Grove";
        pre.stage = "Open";
        pre.mouse = "Realm Ripper";
        post.location!.name = "Acolyte Realm";
        expect(engine.validateMessage(pre, post)).toBe(true);
    })
});

function getValidPreResponse(): ApiResponse {
    return {
        user: null!, // User is not validated here so we dont need it
        page: {},
        success: 1
    }
}

function getValidPostResponse(): ApiResponse {
    const post = getValidPreResponse();
    post.active_turn = true;
    return post;
}

function getDefaultUser(): User {
    return {
        user_id: 0,
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
        quests: null!,
        enviroment_atts: null!,
        viewing_atts: null!
    }
}

function getDefaultIntakeMessage(): IntakeMessage {
    return {
        extension_version: 0,
        user_id: 0,
        entry_id: 0,
        location: {
            id: 0,
            name: 'Fake Location'
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
            name: 'Fake Charm'
        },
        caught: 0,
        attracted: 0,
        mouse: '',
        loot: []
    };
}
