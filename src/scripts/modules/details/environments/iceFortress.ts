import type { JournalMarkup, User } from '@scripts/types/hg';
import type { QuestIceFortress } from '@scripts/types/hg/quests/iceFortress';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

export class IceFortressDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Ice Fortress';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest: QuestIceFortress | undefined = userPost.quests.QuestIceFortress;

        if (quest == null) {
            return;
        }
    }
}
