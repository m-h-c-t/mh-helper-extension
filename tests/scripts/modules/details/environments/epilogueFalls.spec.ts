import {EpilogueFallsDetailer} from '@scripts/modules/details/environments/epilogueFalls';
import {User, JournalMarkup, RapidZoneType, RapidZoneName} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('EpilogueFallsDetailer', () => {
    let detailer: EpilogueFallsDetailer;
    let userPre: User;
    let userPost: User;
    const message = mock<IntakeMessage>();
    const journal = mock<JournalMarkup>();

    beforeEach(() => {
        detailer = new EpilogueFallsDetailer();
        userPre = new UserBuilder().build();
        userPost = new UserBuilder().build();
    });

    describe('environment property', () => {
        it('should return "Epilogue Falls"', () => {
            expect(detailer.environment).toBe('Epilogue Falls');
        });
    });

    describe('addDetails', () => {
        it('should return undefined if quest is null', () => {
            // @ts-expect-error Testing invalid quest state
            userPre.quests.QuestEpilogueFalls = null;
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });

        it('should return undefined if quest is undefined', () => {
            userPre.quests.QuestEpilogueFalls = undefined;
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });

        it('should return undefined if not on rapids', () => {
            userPre.quests.QuestEpilogueFalls = {
                on_rapids: false,
                rapids: {
                    zone_data: {
                        type: 'low_morsel_zone',
                        name: 'Sparse Morsel Zone',
                    },
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });

        it.each<{ zoneType: RapidZoneType, zoneName: RapidZoneName, expectedQuality: "Sparse" | "Common" | "Abundant" }>([
            {zoneType: 'low_morsel_zone', zoneName: 'Sparse Morsel Zone', expectedQuality: 'Sparse'},
            {zoneType: 'medium_algae_zone', zoneName: 'Common Algae Zone', expectedQuality: 'Common'},
            {zoneType: 'rich_halophyte_zone', zoneName: 'Abundant Halophyte Zone', expectedQuality: 'Abundant'}
        ])('should type "zone_quality" as "$expectedQuality" $zoneName', ({zoneType, zoneName, expectedQuality}) => {
            userPre.quests.QuestEpilogueFalls = {
                on_rapids: true,
                rapids: {
                    zone_data: {
                        type: zoneType,
                        name: zoneName,
                    },
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toEqual({zone_quality: expectedQuality});
        });

        it('should return undefined if zone name does not start with a known quality', () => {
            userPre.quests.QuestEpilogueFalls = {
                on_rapids: true,
                rapids: {
                    zone_data: {
                        type: 'grotto_zone',
                        name: 'The Hidden Grotto',
                    },
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });

        it('should return undefined if zone name is empty', () => {
            userPre.quests.QuestEpilogueFalls = {
                on_rapids: true,
                rapids: {
                    zone_data: {
                        // @ts-expect-error Testing invalid zone name
                        type: '',
                        // @ts-expect-error Testing invalid zone name
                        name: '',
                    },
                },
            };
            const result = detailer.addDetails(message, userPre, userPost, journal);
            expect(result).toBeUndefined();
        });
    });
});
