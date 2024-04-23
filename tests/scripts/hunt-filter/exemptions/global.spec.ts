import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage} from '../common';


describe('Global Exemptions', () => {
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
            preMessage = getDefaultIntakeMessage();
            postMessage = getDefaultIntakeMessage();
        });

        it('should accept when cheese runs out', () => {
            preMessage.cheese = {
                id: 42,
                name: 'The Most Amazing',
            };

            postMessage.cheese = {
                id: 0,
                name: '',
            };

            const valid = target.validateMessage(preMessage, postMessage);

            expect(valid).toBe(true);

        });

        it('should accept when charms runs out', () => {
            preMessage.charm = {
                id: 43,
                name: 'The First',
            };

            postMessage.charm = {
                id: 0,
                name: '',
            };

            const valid = target.validateMessage(preMessage, postMessage);

            expect(valid).toBe(true);
        });
    });
});
