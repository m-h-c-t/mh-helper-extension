import {addFieryWarpathStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Fiery Warpath stages', () => {
    it('sets stage to "Portal" when wave is portal', () => {
        const message = {} as IntakeMessage;
        const preUser = {viewing_atts:{desert_warpath: {
            wave: 'portal',
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addFieryWarpathStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Portal');
    });

    it('sets stage to "Wave #" when wave is numbered waved', () => {
        const message = {} as IntakeMessage;
        const preUser = {viewing_atts:{desert_warpath: {
            wave: 4,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addFieryWarpathStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Wave 4');
    });
});
