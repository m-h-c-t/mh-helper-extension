import type { User, JournalMarkup } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

/**
 * Detailer for the Conclusion Cliffs environment.
 *
 * Current Details:
 * chapter_length: string - The length type of the current chapter being written ("short", "medium", or "long")
 */
export class ConclusionCliffsDetailer implements IEnvironmentDetailer {
    readonly environment = 'Conclusion Cliffs';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): object | undefined {
        const quest = userPre.quests.QuestConclusionCliffs;
        if (!quest?.story.is_writing || quest.story.is_postscript) {
            return;
        }

        return {
            chapter_length: quest.story.current_chapter.length_type,
        };
    }
}
