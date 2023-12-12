import {FieryWarpathStager} from "@scripts/modules/stages/environments/fieryWarpath";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Fiery Warpath stages', () => {
    it('should be for the "Fiery Warpath" environment', () => {
        const stager = new FieryWarpathStager();
        expect(stager.environment).toBe('Fiery Warpath');
    });

    it('sets stage to "Portal" when wave is portal', () => {
        const stager = new FieryWarpathStager();

        const message = {} as IntakeMessage;
        const preUser = {viewing_atts:{desert_warpath: {
            wave: 'portal',
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Portal');
    });

    it('sets stage to "Wave #" when wave is numbered waved', () => {
        const stager = new FieryWarpathStager();

        const message = {} as IntakeMessage;
        const preUser = {viewing_atts:{desert_warpath: {
            wave: 4,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Wave 4');
    });

    it.each([undefined, null])('throws when "desert_warpath" viewer atts are null or undefined', (state) => {
        const stager = new FieryWarpathStager();

        const message = {} as IntakeMessage;
        const preUser = {viewing_atts:{desert_warpath: state}} as unknown as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Fiery Warpath viewing attributes are undefined');
    });
});
