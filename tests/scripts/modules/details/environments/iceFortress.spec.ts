import {IceFortressDetailer} from '@scripts/modules/details/environments/iceFortress';
import type {JournalMarkup, User} from '@scripts/types/hg';
import type {IntakeMessage} from '@scripts/types/mhct';

describe('IceFortressDetailer', () => {
    test('getDetails does nothing', () => {
        const detailer = new IceFortressDetailer();
        const message = {} as IntakeMessage;
        const userPost = {
            quests: {
                QuestIceFortress: {},
            },
        } as User;
        const journal = {} as JournalMarkup;

        expect(detailer.addDetails(message, {} as User, userPost, journal)).toBe(undefined);
    });
});
