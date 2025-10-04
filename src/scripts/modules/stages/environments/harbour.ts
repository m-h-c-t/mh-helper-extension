import { type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class HarbourStager implements IStager {
    readonly environment: string = 'Harbour';

    /**
     * Separate hunts with certain mice available from those without.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestHarbour;

        if (!quest) {
            throw new Error('QuestHarbour is undefined');
        }

        // Hunting crew + can't yet claim booty = Pirate Crew mice are in the attraction pool
        if (quest.status === 'searchStarted' && !quest.can_claim) {
            message.stage = 'On Bounty';
        } else {
            message.stage = 'No Bounty';
        }
    }
}
