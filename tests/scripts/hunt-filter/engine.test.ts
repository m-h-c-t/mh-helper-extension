import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {HgResponse, User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/services/logging';
import {getValidPreResponse, getValidPostResponse, getDefaultUser, getDefaultIntakeMessage} from './common';
import {mock} from 'jest-mock-extended';

// Mock logger won't actually call console.log
const logger = mock<LoggerService>();
const engine = new IntakeRejectionEngine(logger);

describe('validateResponse', () => {
    let pre: HgResponse;
    let post: HgResponse;

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
        post.location.name = "Real Location";
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
        pre.stage = {rain: 'Rain 99', wind: 'Wind 99'};
        post.stage = {rain: 'Rain 99', wind: 'Wind 99'};

        expect(engine.validateMessage(pre, post)).toBe(true);
    });

    it('exempts location and stage if realm ripper was caught', () => {
        pre.location.name = "Forbidden Grove";
        pre.stage = "Open";
        pre.mouse = "Realm Ripper";
        post.location.name = "Acolyte Realm";
        expect(engine.validateMessage(pre, post)).toBe(true);
    });

    it('exempts stage if vincent was caught', () => {
        pre.stage = "Boss";
        pre.mouse = "Vincent, The Magnificent";
        post.stage = "Any Room";

        expect(engine.validateMessage(pre, post)).toBe(true);
    });
});


