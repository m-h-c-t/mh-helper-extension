import {IceFortressDetailer} from '@scripts/modules/details/environments/iceFortress';
import {type User} from '@scripts/types/hg';

describe('IceFortressDetailer', () => {
    test('getDetails does nothing', () => {
        const detailer = new IceFortressDetailer();
        const userPost = {
            quests: {
                QuestIceFortress: {},
            },
        } as User;
        expect(detailer.addDetails(null, {} as User, userPost, null)).toBe(undefined);
    });
});
