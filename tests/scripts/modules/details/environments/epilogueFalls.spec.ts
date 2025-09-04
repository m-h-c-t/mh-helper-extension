import {EpilogueFallsDetailer} from '@scripts/modules/details/environments/epilogueFalls';
import {User, JournalMarkup} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {getDefaultIntakeMessage} from '@tests/scripts/hunt-filter/common';

describe('EpilogueFallsDetailer', () => {
    let detailer: EpilogueFallsDetailer;
    let userPre: User;
    let userPost: User;
    let message: IntakeMessage;
    let journal: JournalMarkup;

    beforeEach(() => {
        detailer = new EpilogueFallsDetailer();
        userPre = new UserBuilder().build();
        userPost = new UserBuilder().build();
        message = getDefaultIntakeMessage();
        journal = {} as JournalMarkup;
    });

    describe('environment property', () => {
        it('should return "Epilogue Falls"', () => {
            expect(detailer.environment).toBe('Epilogue Falls');
        });
    });

    describe('addDetails', () => {
        describe('when quest is null', () => {
            it('should return undefined', () => {
                // @ts-expect-error Testing invalid quest state
                userPre.quests.QuestEpilogueFalls = null;

                const result = detailer.addDetails(message, userPre, userPost, journal);

                expect(result).toBeUndefined();
            });
        });

        describe('when quest is undefined', () => {
            it('should return undefined', () => {
                userPre.quests.QuestEpilogueFalls = undefined;

                const result = detailer.addDetails(message, userPre, userPost, journal);

                expect(result).toBeUndefined();
            });
        });

        describe('when quest exists but not on rapids', () => {
            it('should return undefined when on_rapids is false', () => {
                userPre.quests.QuestEpilogueFalls = {
                    on_rapids: null,
                    rapids: {
                        zone_data: {
                            type: 'test_zone',
                            name: 'Test Zone'
                        }
                    }
                };

                const result = detailer.addDetails(message, userPre, userPost, journal);

                expect(result).toBeUndefined();
            });
        });

        describe('when quest exists and on rapids', () => {
            it('should return zone name without " Zone" suffix', () => {
                userPre.quests.QuestEpilogueFalls = {
                    on_rapids: true,
                    rapids: {
                        zone_data: {
                            type: 'low_morsel_zone',
                            name: 'Sparse Morsel Zone'
                        }
                    }
                };

                const result = detailer.addDetails(message, userPre, userPost, journal);

                expect(result).toEqual({
                    zone: 'Sparse Morsel'
                });
            });

            it('should return zone name as-is when no " Zone" suffix', () => {
                userPre.quests.QuestEpilogueFalls = {
                    on_rapids: true,
                    rapids: {
                        zone_data: {
                            type: 'grotto_zone',
                            name: 'The Hidden Grotto'
                        }
                    }
                };

                const result = detailer.addDetails(message, userPre, userPost, journal);

                expect(result).toEqual({
                    zone: 'The Hidden Grotto'
                });
            });

            it('should handle empty zone name', () => {
                userPre.quests.QuestEpilogueFalls = {
                    on_rapids: true,
                    rapids: {
                        zone_data: {
                            type: '',
                            name: ''
                        }
                    }
                };

                const result = detailer.addDetails(message, userPre, userPost, journal);

                expect(result).toEqual({
                    zone: ''
                });
            });
        });
    });
});
