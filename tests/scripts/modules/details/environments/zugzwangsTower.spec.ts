import {ZugzwangsTowerDetailer} from "@scripts/modules/details/environments/zugzwangsTower";
import {JournalMarkup, User, ZugzwangsTowerViewingAttributes} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {UserBuilder} from "@tests/utility/builders";
import {mock} from "jest-mock-extended";

describe('ZugzwangsTowerDetailer', () => {
    const message = mock<IntakeMessage>();
    const user_post = mock<User>();
    const hunt = mock<JournalMarkup>();

    let user: User & { viewing_atts: ZugzwangsTowerViewingAttributes };
    let detailer: ZugzwangsTowerDetailer;

    beforeEach(() => {
        detailer = new ZugzwangsTowerDetailer();

        user = new UserBuilder()
            .withEnvironment({
                environment_id: 0,
                environment_name: "Zugzwang's Tower",
            })
            .withViewingAttributes({viewing_atts: {
                zzt_amplifier: 0,
                zzt_tech_progress: 0,
                zzt_mage_progress: 0,
            }})
            .build() as User & { viewing_atts: ZugzwangsTowerViewingAttributes };
    });

    it('should parse and return basic tower data', () => {
        user.viewing_atts.zzt_amplifier = 5;
        user.viewing_atts.zzt_tech_progress = 8;
        user.viewing_atts.zzt_mage_progress = 12;

        const result = detailer.addDetails(message, user, user_post, hunt);

        expect(result).toEqual({
            amplifier: 5,
            technic: 8,
            mystic: 12,
            cm_available: false,
        });
    });

    describe('Checkmate availability', () => {
        beforeEach(() => {
            message.cheese.id = 371; // Checkmate cheese ID
        });

        it('should be available when technic progress is 16', () => {
            user.viewing_atts.zzt_tech_progress = 16;
            user.viewing_atts.zzt_mage_progress = 8;

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toEqual(expect.objectContaining({
                cm_available: true,
            }));
        });

        it('should be available when mystic progress is 16', () => {
            user.viewing_atts.zzt_tech_progress = 8;
            user.viewing_atts.zzt_mage_progress = 16;

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toEqual(expect.objectContaining({
                cm_available: true,
            }));
        });

        it('should be available when both progress are 16', () => {
            user.viewing_atts.zzt_tech_progress = 16;
            user.viewing_atts.zzt_mage_progress = 16;

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toEqual(expect.objectContaining({
                cm_available: true,
            }));
        });

        it('should not be available when neither progress is 16', () => {
            user.viewing_atts.zzt_tech_progress = 15;
            user.viewing_atts.zzt_mage_progress = 15;

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toEqual(expect.objectContaining({
                cm_available: false,
            }));
        });

        it('should not be available with wrong cheese even if conditions met', () => {
            message.cheese.id = 999; // Not Checkmate cheese
            user.viewing_atts.zzt_tech_progress = 16;
            user.viewing_atts.zzt_mage_progress = 8;

            const result = detailer.addDetails(message, user, user_post, hunt);

            expect(result).toEqual(expect.objectContaining({
                cm_available: false,
            }));
        });
    });

    it('should handle all string values correctly', () => {
        user.viewing_atts.zzt_amplifier = 15;
        user.viewing_atts.zzt_tech_progress = 7;
        user.viewing_atts.zzt_mage_progress = 9;
        message.cheese.id = 371;

        const result = detailer.addDetails(message, user, user_post, hunt);

        expect(result).toEqual({
            amplifier: 15,
            technic: 7,
            mystic: 9,
            cm_available: false,
        });
    });

    it('should handle zero values', () => {
        user.viewing_atts.zzt_amplifier = 0;
        user.viewing_atts.zzt_tech_progress = 0;
        user.viewing_atts.zzt_mage_progress = 0;

        const result = detailer.addDetails(message, user, user_post, hunt);

        expect(result).toEqual({
            amplifier: 0,
            technic: 0,
            mystic: 0,
            cm_available: false,
        });
    });

    it('should handle maximum progress values', () => {
        user.viewing_atts.zzt_amplifier = 10;
        user.viewing_atts.zzt_tech_progress = 16;
        user.viewing_atts.zzt_mage_progress = 16;
        message.cheese.id = 371;

        const result = detailer.addDetails(message, user, user_post, hunt);

        expect(result).toEqual({
            amplifier: 10,
            technic: 16,
            mystic: 16,
            cm_available: true,
        });
    });
});
