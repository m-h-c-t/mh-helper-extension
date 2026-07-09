import type { IntakeMessage } from '@scripts/types/mhct';

import { ceruleanSkyportExemptions } from '@scripts/hunt-filter/exemptions/environments/ceruleanSkyport';
import { getDefaultIntakeMessage } from '@tests/scripts/hunt-filter/common';

describe('Cerulean Skyport exemptions', () => {
    it('accepts a transition to Docked even when cheese changes', () => {
        const exemption = ceruleanSkyportExemptions[0];
        const preMessage = getMessage('Shipping - Atmo', 'Brie');
        const postMessage = getMessage('Docked', 'Gouda');

        expect(exemption.getExemptions(preMessage, postMessage)).toEqual(['cheese', 'stage']);
    });

    it('does not exempt cheese changes outside Docked transitions', () => {
        const exemption = ceruleanSkyportExemptions[0];
        const preMessage = getMessage('Shipping - Atmo', 'Brie');
        const postMessage = getMessage('Shipping - Mining', 'Gouda');

        expect(exemption.getExemptions(preMessage, postMessage)).toBeNull();
    });

    function getMessage(stage: string, cheeseName: string): IntakeMessage {
        return {
            ...getDefaultIntakeMessage(),
            location: {
                id: 0,
                name: 'Cerulean Skyport',
            },
            stage,
            cheese: {
                id: 1,
                name: cheeseName,
            },
        };
    }
});
