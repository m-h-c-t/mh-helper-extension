import { type User } from '@scripts/types/hg';
import { type QuestIceFortress } from '@scripts/types/hg/quests/iceFortress';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class IceFortressStager implements IStager {
    readonly environment: string = 'Ice Fortress';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest: QuestIceFortress | undefined = userPre.quests.QuestIceFortress;

        if (quest == null) {
            return;
        }

        if (quest.shield.is_broken) {
            // Not adding stages of of right now b/c transition rejection
            message.stage = 'Shield Down';
        } else {
            message.stage = 'Shield Up';
        }
    }
}
