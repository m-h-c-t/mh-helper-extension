import {IceFortressStager} from '@scripts/modules/stages/environments/iceFortress';
import {User} from '@scripts/types/hg';

describe('IceFortressStager', () => {
    it('adds boss stage (but not right now)', () => {
        const message = {
        } as any;
        const stager = new IceFortressStager();
        const userPre = {
            quests: {
                QuestIceFortress: {
                    shield: {
                        is_broken: true,
                    },
                },
            },
        } as User;
        stager.addStage(message, userPre, {} as User, {});

        expect(message.stage).not.toBe("Boss");
    });
});
