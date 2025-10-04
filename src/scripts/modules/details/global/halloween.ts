import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IDetailer } from '../details.types';

export class HalloweenDetailer implements IDetailer {
    /**
     * Record if the user has boon active.
     */
    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): HalloweenDetails | undefined {
        const quest = userPre.quests.QuestHalloweenBoilingCauldron;
        if (quest?.reward_track.is_complete) {
            return {
                has_baba_gaga_boon: true,
            };
        }
    }
}

/**
 * Type describing the structure of Halloween details added to message for intake
 */
export interface HalloweenDetails {
    has_baba_gaga_boon: boolean;
}
