import {IntakeRejectionEngine} from '@scripts/hunt-filter/engine';
import {IntakeMessage} from '@scripts/types/mhct';
import {LoggerService} from '@scripts/util/logger';
import {getDefaultIntakeMessage} from '../../common';


describe('Valour Rift', () => {
    const NormalFloors = ['Floors 1-7', 'Floors 9-15', 'Floors 17-23', 'Floors 25-31+'] as const;
    const UmbraFloors = ['UU Floors 1-7', 'UU Floors 9-15', 'UU Floors 17-23', 'UU Floors 25-31+'] as const;
    type NormalFloor = typeof NormalFloors[number];
    type UmbraFloor = typeof UmbraFloors[number];
    type FloorStage = NormalFloor | UmbraFloor;

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
            preMessage = {...getDefaultIntakeMessage(), ...getValourRiftLocation()};
            postMessage = {...getDefaultIntakeMessage(), ...getValourRiftLocation()};
        });

        it.each(NormalFloors)('should reject "Shade of the Eclipse" hunts on transition to normal floor', (postStage: FloorStage) => {
            preMessage.mouse = postMessage.mouse = 'Shade of the Eclipse';
            preMessage.stage = 'Eclipse';
            postMessage.stage = postStage;
            const valid = target.validateMessage(preMessage, postMessage);
            expect(valid).toBe(false);
        });

        it('should reject "Shade of the Eclipse" hunts on transition to outside', () => {
            preMessage.mouse = postMessage.mouse = 'Shade of the Eclipse';
            preMessage.stage = 'Eclipse';
            postMessage.stage = 'Outside';
            const valid = target.validateMessage(preMessage, postMessage);
            expect(valid).toBe(false);
        });

        it.each(UmbraFloors)('should reject "The Total Eclipse" hunts on transition to umbra floor', (postStage: FloorStage) => {
            preMessage.mouse = postMessage.mouse = 'The Total Eclipse';
            preMessage.stage = 'UU Eclipse';
            postMessage.stage = postStage;
            const valid = target.validateMessage(preMessage, postMessage);
            expect(valid).toBe(false);
        });

        it('should reject "The Total Eclipse" hunts on transition to outside', () => {
            preMessage.mouse = postMessage.mouse = 'The Total Eclipse';
            preMessage.stage = 'UU Eclipse';
            postMessage.stage = 'Outside';
            const valid = target.validateMessage(preMessage, postMessage);
            expect(valid).toBe(false);
        });
    });

    function getValourRiftLocation() {
        return {
            location:
            {
                id: 62, // Could be 0 for testing, but it is the real id
                name: 'Valour Rift',
            },
        };
    }
});
