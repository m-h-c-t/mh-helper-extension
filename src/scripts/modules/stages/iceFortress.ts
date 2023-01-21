import { IStager } from './stages';
import { QuestIceFortress } from '@scripts/types/quests/iceFortress';
import { User } from '@scripts/types/hg';

export class IceFortressStager implements IStager {
    readonly environment: string = 'Ice Fortress';

    addStage(message: any, userPre: User, userPost: User, journal: any): void {
        const quest: QuestIceFortress | undefined = userPre.quests.QuestIceFortress;

        if (quest == null) {
            return;
        }

        if (quest.shield.is_broken) {
            // Not adding stages of of right now b/c transition rejection
            // message.stage = "Boss";
        }
    }
}
