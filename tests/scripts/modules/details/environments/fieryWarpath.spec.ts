import {FieryWarpathDetailer} from '@scripts/modules/details/environments/fieryWarpath';
import type {User, JournalMarkup, FieryWarpathViewingAttributes} from '@scripts/types/hg';
import type {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'vitest-mock-extended';

describe('FieryWarpathDetailer', () => {
    const message = mock<IntakeMessage>();
    const journal = mock<JournalMarkup>();

    let userPre: User & { viewing_atts: FieryWarpathViewingAttributes };
    let userPost: User & { viewing_atts: FieryWarpathViewingAttributes };
    let detailer: FieryWarpathDetailer;

    beforeEach(() => {
        detailer = new FieryWarpathDetailer();
        userPre = new UserBuilder()
            .withViewingAttributes(getDefaultViewingAttributes())
            .build() as User & { viewing_atts: FieryWarpathViewingAttributes };
        userPost = new UserBuilder()
            .withViewingAttributes(getDefaultViewingAttributes())
            .build() as User & { viewing_atts: FieryWarpathViewingAttributes };
    });

    describe('addDetails', () => {
        it('should throw when viewing_atts is not available', () => {
            // @ts-expect-error - testing undefined input
            userPre.viewing_atts.desert_warpath = undefined;

            expect(() => detailer.addDetails(message, userPre, userPost, journal))
                .toThrow();
        });

        it('should handle wave 1 with streak data', () => {
            message.caught = 1; // Simulate a catch

            userPre.viewing_atts.desert_warpath.wave = 1;
            userPre.viewing_atts.desert_warpath.streak_quantity = 5;
            userPre.viewing_atts.desert_warpath.streak_type = 'desert_warrior';
            userPre.viewing_atts.desert_warpath.has_support_mice = 'active';
            userPre.viewing_atts.desert_warpath.mice = {
                desert_warrior: {quantity: 10, status: 'active'},
                desert_scout: {quantity: 15, status: 'active'},
                desert_archer: {quantity: 20, status: 'active'},
            };
            userPost.viewing_atts.desert_warpath.streak_type = 'desert_warrior';

            const result = detailer.addDetails(message, userPre, userPost, journal);

            expect(result).toMatchObject({
                streak_count: 5,
                streak_type: 'warrior',
                streak_increased_on_hunt: true,
                num_warrior: 10,
                num_scout: 15,
                num_archer: 20,
                morale: 45 / 105,
                has_support_mice: true,
                support_morale: (105 - 45) / (0.9 * 105)
            });
        });

        it('should handle wave 4 boss wave', () => {
            message.stage = 'Boss';

            userPre.viewing_atts.desert_warpath.wave = 4;
            userPre.viewing_atts.desert_warpath.mice = {
                desert_boss: {quantity: 1, status: 'active'},
                desert_elite_gaurd: {quantity: 3, status: 'active'},
            };

            const result = detailer.addDetails(message, userPre, userPost, journal);

            expect(result).toEqual({
                num_warden: 3,
                boss_invincible: true
            });
        });

        it('should handle portal wave', () => {
            message.stage = 'Portal';
            userPre.viewing_atts.desert_warpath.wave = 'portal';
            userPre.viewing_atts.desert_warpath.mice = {
                desert_artillery_commander: {quantity: 1, status: 'active'},
                // gaurd is a typo in the game, do not fix
                desert_elite_gaurd: {quantity: 0, status: 'inactive'}
            };

            const result = detailer.addDetails(message, userPre, userPost, journal);

            expect(result).toEqual({
                num_warden: 0,
                boss_invincible: false
            });
        });

        it('should return undefined when boss already defeated', () => {
            message.stage = 'Boss';
            userPre.viewing_atts.desert_warpath.wave = 4;
            userPre.viewing_atts.desert_warpath.mice = {
                desert_boss: {quantity: 0, status: 'inactive'}
            };

            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });
    });

    function getDefaultViewingAttributes(): {viewing_atts: FieryWarpathViewingAttributes} {
        return {
            viewing_atts: {
                desert_warpath: {
                    wave: 0,
                    streak_quantity: 0,
                    streak_type: '',
                    mice: {
                    },
                    has_support_mice: '',
                    morale_percent: 0,
                    show_portal: ''
                }
            }
        };
    }
});
