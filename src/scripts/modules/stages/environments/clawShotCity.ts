import { type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class ClawShotCityStager implements IStager {
    readonly environment: string = 'Claw Shot City';

    /**
     * Separate hunts with certain mice available from those without.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestClawShotCity;

        if (!quest) {
            throw new Error('QuestClawShotCity is undefined');
        }

        /**
         * !map_active && !has_wanted_poster => Bounty Hunter can be attracted
         * !map_active && has_wanted_poster => Bounty Hunter is not attracted
         * map_active && !has_wanted_poster => On a Wanted Poster
         */

        if (!quest.map_active && !quest.has_wanted_poster) {
            message.stage = 'No poster';
        } else if (!quest.map_active && quest.has_wanted_poster) {
            message.stage = 'Has poster';
        } else if (quest.map_active) {
            message.stage = 'Using poster';
        } else {
            throw new Error('Unexpected Claw Shot City quest state');
        }
    }
}
