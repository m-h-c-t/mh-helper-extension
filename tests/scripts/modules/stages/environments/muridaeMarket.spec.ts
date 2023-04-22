import {addMuridaeMarketStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Muridae Market stages', () => {
    it('should set stage to "Artisan" if user has artisan charm equipped', () => {
        const message = {} as IntakeMessage;
        const preUser = {trinket_name: 'Artisan Charm'} as User;
        const postUser = {} as User;
        const journal = {};

        addMuridaeMarketStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Artisan');
    });

    it('should set stage to "Not Artisan" if user does not has artisan charm equipped', () => {
        const message = {} as IntakeMessage;
        const preUser = {trinket_name: 'Power Charm'} as User;
        const postUser = {} as User;
        const journal = {};

        addMuridaeMarketStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Not Artisan');
    });
});
