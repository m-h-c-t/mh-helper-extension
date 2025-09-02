import {ValourRiftDetailer} from '@scripts/modules/details/environments/valourRift';
import {User, JournalMarkup} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('ValourRiftDetailer', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;
    let detailer: ValourRiftDetailer;

    beforeEach(() => {
        user = new UserBuilder().build();
        detailer = new ValourRiftDetailer();
    });

    it('should return undefined when not in tower state', () => {
        user.quests.QuestRiftValour = {
            state: 'farming',
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return floor number when in tower state', () => {
        user.quests.QuestRiftValour = {
            state: 'tower',
            floor: 15,
            active_augmentations: {
            },
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            floor: 15,
        });
    });

    it('should handle different floor numbers', () => {
        user.quests.QuestRiftValour = {
            state: 'tower',
            floor: 42,
            active_augmentations: {
            },
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            floor: 42,
        });
    });

    it('should work with misspelled enviroment_atts', () => {
        user.quests.QuestRiftValour = {
            state: 'tower',
            floor: 8,
            active_augmentations: {
            },
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            floor: 8,
        });
    });

    // Note: The commented out augmentation tests are not implemented
    // as per the original code comment "No compelling use case for the following 3 augments at the moment"
    it('should not include augmentation data', () => {
        user.quests.QuestRiftValour = {
            state: 'tower',
            floor: 5,
            active_augmentations: {
                ss: true,
                sste: false,
                er: true,
            },
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            floor: 5,
        });
        expect(result).not.toHaveProperty('super_siphon');
        expect(result).not.toHaveProperty('string_stepping');
        expect(result).not.toHaveProperty('elixir_rain');
    });
});
