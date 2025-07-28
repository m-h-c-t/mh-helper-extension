import {calcFortRoxHuntDetails} from '@scripts/modules/details/legacy';
import {User, JournalMarkup} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('calcFortRoxHuntDetails', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;

    beforeEach(() => {
        user = new UserBuilder()
            .withQuests({
                QuestFortRox: {
                    is_day: null,
                    is_night: null,
                    is_dawn: null,
                    is_lair: null,
                    current_stage: null,
                    tower_status: '',
                    fort: {
                        w: {
                            level: 0,
                            status: 'inactive'
                        },
                        b: {
                            level: 0,
                            status: 'inactive'
                        },
                        c: {
                            level: 0,
                            status: 'inactive'
                        },
                        m: {
                            level: 0,
                            status: 'inactive'
                        },
                        t: {
                            level: 0,
                            status: 'inactive'
                        }
                    }
                }
            })
            .build();
    });

    describe('during night phase', () => {
        beforeEach(() => {
            user.quests.QuestFortRox!.is_night = true;
        });

        describe('ballista effects', () => {
            it('should enable weakened weremice at level 1+', () => {
                user.quests.QuestFortRox!.fort.b.level = 1;

                const result = calcFortRoxHuntDetails(message, user, userPost, journal);

                expect(result).toEqual(expect.objectContaining({
                    weakened_weremice: true,
                    can_autocatch_weremice: false,
                    autocatch_nightmancer: false,
                }));
            });

            it('should enable autocatch weremice at level 2+', () => {
                user.quests.QuestFortRox!.fort.b.level = 2;

                const result = calcFortRoxHuntDetails(message, user, userPost, journal);

                expect(result).toEqual(expect.objectContaining({
                    weakened_weremice: true,
                    can_autocatch_weremice: true,
                    autocatch_nightmancer: false,
                }));
            });

            it('should enable autocatch nightmancer at level 3+', () => {
                user.quests.QuestFortRox!.fort.b.level = 3;

                const result = calcFortRoxHuntDetails(message, user, userPost, journal);

                expect(result).toEqual(expect.objectContaining({
                    weakened_weremice: true,
                    can_autocatch_weremice: true,
                    autocatch_nightmancer: true,
                }));
            });
        });

        describe('cannon effects', () => {
            it('should enable weakened critters at level 1+', () => {
                user.quests.QuestFortRox!.fort.c.level = 1;

                const result = calcFortRoxHuntDetails(message, user, userPost, journal);

                expect(result).toEqual(expect.objectContaining({
                    weakened_critters: true,
                    can_autocatch_critters: false,
                    autocatch_nightfire: false,
                }));
            });

            it('should enable autocatch critters at level 2+', () => {
                user.quests.QuestFortRox!.fort.c.level = 2;

                const result = calcFortRoxHuntDetails(message, user, userPost, journal);

                expect(result).toEqual(expect.objectContaining({
                    weakened_critters: true,
                    can_autocatch_critters: true,
                    autocatch_nightfire: false,
                }));
            });

            it('should enable autocatch nightfire at level 3+', () => {
                user.quests.QuestFortRox!.fort.c.level = 3;

                const result = calcFortRoxHuntDetails(message, user, userPost, journal);

                expect(result).toEqual(expect.objectContaining({
                    weakened_critters: true,
                    can_autocatch_critters: true,
                    autocatch_nightfire: true,
                }));
            });
        });

        it('should combine ballista and cannon effects', () => {
            user.quests.QuestFortRox!.fort.b.level = 3;
            user.quests.QuestFortRox!.fort.c.level = 2;

            const result = calcFortRoxHuntDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                weakened_weremice: true,
                can_autocatch_weremice: true,
                autocatch_nightmancer: true,
                weakened_critters: true,
                can_autocatch_critters: true,
                autocatch_nightfire: false,
            }));
        });
    });

    describe('during day/dawn phases', () => {
        beforeEach(() => {
            user.quests.QuestFortRox!.is_night = null;
        });

        it('should not include night-specific effects', () => {
            user.quests.QuestFortRox!.fort.b.level = 3;
            user.quests.QuestFortRox!.fort.c.level = 3;

            const result = calcFortRoxHuntDetails(message, user, userPost, journal);

            expect(result).not.toHaveProperty('weakened_weremice');
            expect(result).not.toHaveProperty('can_autocatch_weremice');
            expect(result).not.toHaveProperty('autocatch_nightmancer');
            expect(result).not.toHaveProperty('weakened_critters');
            expect(result).not.toHaveProperty('can_autocatch_critters');
            expect(result).not.toHaveProperty('autocatch_nightfire');
        });
    });

    describe('mage tower effects', () => {
        it('should enable autocatch when tower level 2+ and active', () => {
            user.quests.QuestFortRox!.tower_status = 'active level 2';
            user.quests.QuestFortRox!.fort.t.level = 2;

            const result = calcFortRoxHuntDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                can_autocatch_any: true,
            }));
        });

        it('should enable autocatch when tower level 3+', () => {
            user.quests.QuestFortRox!.tower_status = 'active level 3';
            user.quests.QuestFortRox!.fort.t.level = 3;

            const result = calcFortRoxHuntDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                can_autocatch_any: true,
            }));
        });

        it('should not enable autocatch when tower is inactive', () => {
            user.quests.QuestFortRox!.tower_status = 'inactive';
            user.quests.QuestFortRox!.fort.t.level = 3;

            const result = calcFortRoxHuntDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                can_autocatch_any: false,
            }));
        });

        it('should not enable autocatch when tower level < 2', () => {
            user.quests.QuestFortRox!.tower_status = 'active level 1';
            user.quests.QuestFortRox!.fort.t.level = 1;

            const result = calcFortRoxHuntDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                can_autocatch_any: false,
            }));
        });
    });

    it('should work during night with mage tower effects', () => {
        user.quests.QuestFortRox!.is_night = true;
        user.quests.QuestFortRox!.fort.b.level = 2;
        user.quests.QuestFortRox!.fort.c.level = 1;
        user.quests.QuestFortRox!.tower_status = 'active';
        user.quests.QuestFortRox!.fort.t.level = 3;

        const result = calcFortRoxHuntDetails(message, user, userPost, journal);

        expect(result).toEqual({
            weakened_weremice: true,
            can_autocatch_weremice: true,
            autocatch_nightmancer: false,
            weakened_critters: true,
            can_autocatch_critters: false,
            autocatch_nightfire: false,
            can_autocatch_any: true,
        });
    });
});
