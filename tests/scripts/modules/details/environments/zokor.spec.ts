import {calcZokorHuntDetails} from '@scripts/modules/details/legacy';
import {User, JournalMarkup} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('calcZokorHuntDetails', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;

    beforeEach(() => {
        user = new UserBuilder()
            .withQuests({
                QuestAncientCity: {
                    district_name: '',
                    boss: '',
                    countdown: 0,
                    width: 0,
                    district_tier: 0
                }
            })
            .build();
    });

    describe('when in Minotaur lair (hiddenDistrict)', () => {
        beforeEach(() => {
            user.quests.QuestAncientCity!.boss = 'hiddenDistrict napping';
            user.quests.QuestAncientCity!.countdown = 15;
            user.quests.QuestAncientCity!.width = 75.5;
        });

        it('should return minotaur lair details', () => {
            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toEqual({
                minotaur_label: 'napping',
                lair_catches: 5, // -(15 - 20) = 5
                minotaur_meter: 75.5,
            });
        });

        it('should handle different district names', () => {
            user.quests.QuestAncientCity!.boss = 'hiddenDistrict awake';

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                minotaur_label: 'awake',
            }));
        });

        it('should calculate lair catches correctly', () => {
            user.quests.QuestAncientCity!.countdown = 18;

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                lair_catches: 2, // -(18 - 20) = 2
            }));
        });

        it('should handle zero catches', () => {
            user.quests.QuestAncientCity!.countdown = 20;

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            // -0 needs weird case with jest
            expect(result?.lair_catches).toBeCloseTo(0, 0);
        });

        it('should parse width as float', () => {
            user.quests.QuestAncientCity!.width = 42.75;

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                minotaur_meter: 42.75,
            }));
        });
    });

    describe('when in level-3 district', () => {
        beforeEach(() => {
            user.quests.QuestAncientCity!.district_tier = 3;
        });

        it('should return boss defeated status when boss is defeated', () => {
            user.quests.QuestAncientCity!.boss = 'defeated';

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toEqual({
                boss_defeated: true,
            });
        });

        it('should return boss not defeated when boss is not defeated', () => {
            user.quests.QuestAncientCity!.boss = 'active';

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toEqual({
                boss_defeated: false,
            });
        });

        it('should handle empty boss string', () => {
            user.quests.QuestAncientCity!.boss = '';

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toEqual({
                boss_defeated: false,
            });
        });
    });

    describe('when not in special districts', () => {
        it('should return undefined for tier 1 district', () => {
            user.quests.QuestAncientCity!.district_tier = 1;
            user.quests.QuestAncientCity!.boss = 'some boss';

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toBeUndefined();
        });

        it('should return undefined for tier 2 district', () => {
            user.quests.QuestAncientCity!.district_tier = 2;
            user.quests.QuestAncientCity!.boss = 'some boss';

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toBeUndefined();
        });

        it('should return undefined for normal boss state', () => {
            user.quests.QuestAncientCity!.boss = 'normalBoss';

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toBeUndefined();
        });
    });

    describe('priority handling', () => {
        it('should prioritize hiddenDistrict over tier 3', () => {
            user.quests.QuestAncientCity!.boss = 'hiddenDistrict enraged';
            user.quests.QuestAncientCity!.district_tier = 3;
            user.quests.QuestAncientCity!.countdown = 16;
            user.quests.QuestAncientCity!.width = 88.0;

            const result = calcZokorHuntDetails(message, user, userPost, journal);

            expect(result).toEqual({
                minotaur_label: 'enraged',
                lair_catches: 4,
                minotaur_meter: 88.0,
            });
            expect(result).not.toHaveProperty('boss_defeated');
        });
    });
});
