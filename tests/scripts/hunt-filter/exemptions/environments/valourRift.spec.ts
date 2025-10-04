import type { FloorStage } from '@scripts/hunt-filter/exemptions/environments/valourRift';
import type { LoggerService } from '@scripts/services/logging';
import type { IntakeMessage } from '@scripts/types/mhct';

import { IntakeRejectionEngine } from '@scripts/hunt-filter/engine';
import { NormalFloorStages, UmbraFloorStages } from '@scripts/hunt-filter/exemptions/environments/valourRift';

import { getDefaultIntakeMessage } from '../../common';

describe('Valour Rift', () => {
    let logger: LoggerService;
    let target: IntakeRejectionEngine;

    beforeEach(() => {
        logger = {} as LoggerService;
        target = new IntakeRejectionEngine(logger);

        logger.debug = vi.fn();
    });

    describe('validateMessage', () => {
        let preMessage: IntakeMessage;
        let postMessage: IntakeMessage;

        beforeEach(() => {
            preMessage = {...getDefaultIntakeMessage(), ...getValourRiftLocation()};
            postMessage = {...getDefaultIntakeMessage(), ...getValourRiftLocation()};
        });

        it.each(NormalFloorStages)('should accept Shade of the Eclipse hunts on transition to normal floor', (postStage: FloorStage) => {
            preMessage.mouse = postMessage.mouse = 'Shade of the Eclipse';
            preMessage.stage = 'Eclipse';
            postMessage.stage = postStage;
            const valid = target.validateMessage(preMessage, postMessage);
            expect(valid).toBe(true);
        });

        it('should accept Shade of the Eclipse hunts on transition to outside', () => {
            preMessage.mouse = postMessage.mouse = 'Shade of the Eclipse';
            preMessage.stage = 'Eclipse';
            postMessage.stage = 'Outside';
            const valid = target.validateMessage(preMessage, postMessage);
            expect(valid).toBe(true);
        });

        it.each(UmbraFloorStages)('should accept The Total Eclipse hunts on transition to umbra floor', (postStage: FloorStage) => {
            preMessage.mouse = postMessage.mouse = 'The Total Eclipse';
            preMessage.stage = 'UU Eclipse';
            postMessage.stage = postStage;
            const valid = target.validateMessage(preMessage, postMessage);
            expect(valid).toBe(true);
        });

        it('should accept The Total Eclipse hunts on transition to outside', () => {
            preMessage.mouse = postMessage.mouse = 'The Total Eclipse';
            preMessage.stage = 'UU Eclipse';
            postMessage.stage = 'Outside';
            const valid = target.validateMessage(preMessage, postMessage);
            expect(valid).toBe(true);
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
