import {calcValourRiftHuntDetails} from '@scripts/modules/details/legacy';
import {User, JournalMarkup} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('calcValourRiftHuntDetails', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;

    beforeEach(() => {
        user = new UserBuilder().build();
    });

    it('should return undefined when not in tower state', () => {
        user.quests.QuestRiftValour = {
            state: 'farming',
        };

        const result = calcValourRiftHuntDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return floor number when in tower state', () => {
        user.quests.QuestRiftValour = {
            state: 'tower',
            floor: 15,
            is_eclipse_mode: null,
        };

        const result = calcValourRiftHuntDetails(message, user, userPost, journal);

        expect(result).toEqual({
            floor: 15,
        });
    });

    it('should handle different floor numbers', () => {
        user.quests.QuestRiftValour = {
            state: 'tower',
            floor: 42,
            is_eclipse_mode: null,
        };

        const result = calcValourRiftHuntDetails(message, user, userPost, journal);

        expect(result).toEqual({
            floor: 42,
        });
    });

    it('should work with misspelled enviroment_atts', () => {
        user.quests.QuestRiftValour = {
            state: 'tower',
            floor: 8,
            is_eclipse_mode: null,
        };

        const result = calcValourRiftHuntDetails(message, user, userPost, journal);

        expect(result).toEqual({
            floor: 8,
        });
    });
});
