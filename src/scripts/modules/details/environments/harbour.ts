import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

export class HarbourDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Harbour';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestHarbour;

        if (!quest) {
            return;
        }

        // Report whether certain mice were attractable on the hunt.
        const details: Record<string, unknown> = {
            on_bounty: (quest.status === 'searchStarted'),
        };

        quest.crew.forEach((mouse) => {
            details[`has_caught_${mouse.type}`] = (mouse.status === 'caught');
        });

        return details;
    }
}
