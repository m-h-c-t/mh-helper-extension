import {mock} from 'jest-mock-extended';
import {calcFieryWarpathHuntDetails} from '@scripts/modules/details/legacy';
import type {User, JournalMarkup} from '@scripts/types/hg';
import type {IntakeMessage} from '@scripts/types/mhct';

describe('FieryWarpathDetailer', () => {
    describe('addDetails', () => {
        it('should throw when viewing_atts is not available', () => {
            const userPre = mock<User>({viewing_atts: {
                journal: {

                }
            }});
            const userPost = mock<User>();
            const journal = mock<JournalMarkup>();
            const message = mock<IntakeMessage>();

            expect(() => calcFieryWarpathHuntDetails(message, userPre, userPost, journal))
                .toThrow();
        });

        it('should handle wave 1 with streak data', () => {
            const userPre = mock<User>({
                viewing_atts: {
                    desert_warpath: {
                        wave: 1,
                        streak_quantity: 5,
                        streak_type: 'desert_warrior',
                        has_support_mice: 'active',
                        mice: {
                            desert_warrior: {quantity: 10},
                            desert_scout: {quantity: 15},
                            desert_archer: {quantity: 20}
                        }
                    }
                }
            });
            const userPost = mock<User>({
                viewing_atts: {
                    desert_warpath: {
                        streak_type: 'desert_warrior'
                    }
                }
            });
            const journal = mock<JournalMarkup>();
            const message = mock<IntakeMessage>({caught: 1});

            const result = calcFieryWarpathHuntDetails(message, userPre, userPost, journal);

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
            const userPre = mock<User>({
                viewing_atts: {
                    desert_warpath: {
                        wave: 4,
                        mice: {
                            desert_boss: {quantity: 1},
                            desert_elite_gaurd: {quantity: 3}
                        }
                    }
                }
            });
            const userPost = mock<User>();
            const journal = mock<JournalMarkup>();
            const message = mock<IntakeMessage>({stage: 'Boss'});

            const result = calcFieryWarpathHuntDetails(message, userPre, userPost, journal);

            expect(result).toEqual({
                num_warden: 3,
                boss_invincible: true
            });
        });

        it('should handle portal wave', () => {
            const userPre = mock<User>({
                viewing_atts: {
                    desert_warpath: {
                        wave: 'portal',
                        mice: {
                            desert_artillery_commander: {quantity: 1},
                            desert_elite_gaurd: {quantity: 0}
                        }
                    }
                }
            });
            const userPost = mock<User>();
            const journal = mock<JournalMarkup>();
            const message = mock<IntakeMessage>({stage: 'Portal'});

            const result = calcFieryWarpathHuntDetails(message, userPre, userPost, journal);

            expect(result).toEqual({
                num_warden: 0,
                boss_invincible: false
            });
        });

        it('should return undefined when boss already defeated', () => {
            const userPre = mock<User>({
                viewing_atts: {
                    desert_warpath: {
                        wave: 4,
                        mice: {
                            desert_boss: {quantity: 0}
                        }
                    }
                }
            });
            const userPost = mock<User>();
            const journal = mock<JournalMarkup>();
            const message = mock<IntakeMessage>({stage: 'Boss'});

            const result = calcFieryWarpathHuntDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });
    });
});
