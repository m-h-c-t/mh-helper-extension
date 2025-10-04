import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IStager } from '../stages.types';

/**
 * Stages the Afterword Acres environment.
 *
 * Current Stages:
 * 1x
 * 2x
 * 4x
 * 8x
 */
export class AfterwordAcresStager implements IStager {
    readonly environment = 'Afterword Acres';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestAfterwordAcres;
        if (!quest) {
            throw new Error('QuestAfterwordAcres not found');
        }

        // Should we be more defensive about the quest state?
        // Could grab multiplier from blight_thresholds array
        if (quest.blight_tier === 'tier_1') {
            message.stage = '1x';
        } else if (quest.blight_tier === 'tier_2') {
            message.stage = '2x';
        } else if (quest.blight_tier === 'tier_3') {
            message.stage = '4x';
        } else if (quest.blight_tier === 'tier_4') {
            message.stage = '8x';
        } else {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Unknown blight tier: ${quest.blight_tier}`);
        }
    }
}
