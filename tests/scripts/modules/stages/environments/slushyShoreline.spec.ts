import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { SlushyShorelineStager } from '@scripts/modules/stages/environments/slushyShoreline';

describe('Slushy Shoreline stages', () => {
    it('should be for the "Slushy Shoreline" environment', () => {
        const stager = new SlushyShorelineStager();
        expect(stager.environment).toBe('Slushy Shoreline');
    });

    it('should set stage to "Softserve" if user has softserve charm equipped', () => {
        const stager = new SlushyShorelineStager();
        const message = {} as IntakeMessage;
        const preUser = {trinket_name: 'Softserve Charm'} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Softserve');
    });

    it('should set stage to "Not Softserve" if user does not has softserve charm equipped', () => {
        const stager = new SlushyShorelineStager();
        const message = {} as IntakeMessage;
        const preUser = {trinket_name: 'Power Charm'} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Not Softserve');
    });
});
