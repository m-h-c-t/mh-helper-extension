import {addSlushyShorelineStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Slushy Shoreline stages', () => {
    it('should set stage to "Softserve" if user has softserve charm equipped', () => {
        const message = {} as IntakeMessage;
        const preUser = {trinket_name: 'Softserve Charm'} as User;
        const postUser = {} as User;
        const journal = {};

        addSlushyShorelineStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Softserve');
    });

    it('should set stage to "Not Softserve" if user does not has softserve charm equipped', () => {
        const message = {} as IntakeMessage;
        const preUser = {trinket_name: 'Power Charm'} as User;
        const postUser = {} as User;
        const journal = {};

        addSlushyShorelineStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Not Softserve');
    });
});
