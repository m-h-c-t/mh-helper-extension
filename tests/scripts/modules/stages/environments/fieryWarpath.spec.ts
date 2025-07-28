import {FieryWarpathStager} from "@scripts/modules/stages/environments/fieryWarpath";
import {FieryWarpathViewingAttributes, JournalMarkup, User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {UserBuilder} from "@tests/utility/builders";
import {mock} from "jest-mock-extended";

describe('Fiery Warpath stages', () => {
    const message = mock<IntakeMessage>();
    const postUser = mock<User>();
    const journal = mock<JournalMarkup>();

    const viewingAttributes: FieryWarpathViewingAttributes = {
        desert_warpath: {
            wave: 0,
            streak_quantity: 0,
            streak_type: '',
            mice: {},
            has_support_mice: 'active',
            morale_percent: 0,
            show_portal: '',
        }
    };
    let preUser: User & { viewing_atts: FieryWarpathViewingAttributes };

    const stager = new FieryWarpathStager();

    beforeEach(() => {
        preUser = new UserBuilder()
            .withEnvironment({
                environment_id: 0,
                environment_name: 'Fiery Warpath',
            })
            .withViewingAttributes({
                viewing_atts: viewingAttributes,
            })
            .build() as User & { viewing_atts: FieryWarpathViewingAttributes };
    });

    it('should be for the "Fiery Warpath" environment', () => {
        expect(stager.environment).toBe('Fiery Warpath');
    });

    it('sets stage to "Portal" when wave is portal', () => {
        preUser.viewing_atts.desert_warpath.wave = 'portal';

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Portal');
    });

    it('sets stage to "Wave #" when wave is numbered waved', () => {
        preUser.viewing_atts.desert_warpath.wave = 4;

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Wave 4');
    });

    it.each([undefined, null])('throws when "desert_warpath" viewer atts are null or undefined', (state) => {
        // @ts-expect-error - testing nullish input
        preUser.viewing_atts.desert_warpath = state;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Fiery Warpath viewing attributes are undefined');
    });
});
