import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage} from '../../common';


describe('Bountiful Beanstalk exemptions', () => {
    let logger: LoggerService;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        logger = {} as LoggerService;
        target = new IntakeRejectionEngine(logger);

        logger.debug = jest.fn();
    });

    describe('validateMessage', () => {
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preMessage = {...getDefaultIntakeMessage(), ...getBountifulBeanstalkLocation()};
            postMessage = {...getDefaultIntakeMessage(), ...getBountifulBeanstalkLocation()};
        });

        describe('Beanstalk', () => {
            it('should accept on transition to boss', () => {
                preMessage.mouse = postMessage.mouse = 'Budrich Thornborn';
                preMessage.stage = 'Beanstalk';
                postMessage.stage = 'Beanstalk Boss';
                const valid = target.validateMessage(preMessage, postMessage);
                expect(valid).toBe(true);
            });

            it('should accept on transition from boss', () => {
                preMessage.mouse = postMessage.mouse = 'Vinneus Stalkhome';
                preMessage.stage = 'Beanstalk Boss';
                postMessage.stage = 'Beanstalk';
                const valid = target.validateMessage(preMessage, postMessage);
                expect(valid).toBe(true);
            });
        });

        describe('Castle', () => {
            it('should reject on transition to boss', () => {
                preMessage.mouse = postMessage.mouse = 'Wrathful Warden';
                preMessage.stage = 'Dungeon';
                postMessage.stage = 'Dungeon Giant';
                const valid = target.validateMessage(preMessage, postMessage);
                expect(valid).toBe(false);
            });

            it('should accept on transition from giant to beanstalk', () => {
                preMessage.mouse = postMessage.mouse = 'Dungeon Master';
                preMessage.stage = 'Dungeon Giant';
                postMessage.stage = 'Beanstalk';
                const valid = target.validateMessage(preMessage, postMessage);
                expect(valid).toBe(true);
            });

            it('should accept on transition from giant to beanstalk boss', () => {
                preMessage.mouse = postMessage.mouse = 'Dungeon Master';
                preMessage.stage = 'Dungeon Giant';
                postMessage.stage = 'Beanstalk Boss';
                const valid = target.validateMessage(preMessage, postMessage);
                expect(valid).toBe(true);
            });
        });
    });

    function getBountifulBeanstalkLocation() {
        return {
            location:
            {
                id: 71, // Could be 0 for testing, but it is the real id
                name: 'Bountiful Beanstalk',
            },
        };
    }
});
