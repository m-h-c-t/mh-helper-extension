import type { JournalMarkup, User } from '@scripts/types/hg';
import type { QuestDraconicDepths } from '@scripts/types/hg/quests/draconicDepths';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

export class DraconicDepthsDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Draconic Depths';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest: QuestDraconicDepths | undefined = userPost.quests.QuestDraconicDepths;

        if (quest == null) {
            return;
        }

        if (quest.in_cavern && quest.cavern) {
            if (quest.cavern.type === 'elemental_dragon_den') {
                return;
            }

            let multiplier: 1 | 2 | 3 = 1;
            if (quest.cavern.type.startsWith('double')) {
                multiplier = 2;
            } else if (quest.cavern.type.startsWith('triple')) {
                multiplier = 3;
            } else {
                throw new Error(`Unknown cavern type: ${quest.cavern.type}`);
            }

            return {
                rods: multiplier
            };
        }
    }
}
