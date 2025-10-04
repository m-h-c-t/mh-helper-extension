import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { MuridaeMarketStager } from '@scripts/modules/stages/environments/muridaeMarket';

describe('Muridae Market stages', () => {
    it('should be for the "Muridae Market" environment', () => {
        const stager = new MuridaeMarketStager();
        expect(stager.environment).toBe('Muridae Market');
    });

    it('should set stage to "Artisan" if user has artisan charm equipped', () => {
        const stager = new MuridaeMarketStager();
        const message = {} as IntakeMessage;
        const preUser = {trinket_name: 'Artisan Charm'} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Artisan');
    });

    it('should set stage to "Not Artisan" if user does not has artisan charm equipped', () => {
        const stager = new MuridaeMarketStager();
        const message = {} as IntakeMessage;
        const preUser = {trinket_name: 'Power Charm'} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Not Artisan');
    });
});
