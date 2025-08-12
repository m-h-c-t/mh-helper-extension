import type {JournalMarkup, User} from '@scripts/types/hg';
import type {IEnvironmentDetailer} from '../details.types';
import type {IntakeMessage} from '@scripts/types/mhct';

export class TableOfContentsDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Table of Contents';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestTableOfContents;

        // Track the current volume if we're in an Encyclopedia
        if (!quest?.current_book || quest.current_book.volume <= 0) {
            return;
        }

        return {
            volume: quest.current_book.volume,
        };
    }
}
