import type { User, JournalMarkup } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { ValourRiftDetailer } from '@scripts/modules/details/environments/valourRift';
import { UserBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

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
            is_eclipse_mode: null,
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
            is_eclipse_mode: null,
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
            is_eclipse_mode: null,
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            floor: 8,
        });
    });
});
