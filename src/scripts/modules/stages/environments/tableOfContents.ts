import { type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class TableOfContentsStager implements IStager {
    readonly environment: string = 'Table of Contents';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestTableOfContents;

        if (!quest) {
            throw new Error('QuestTableOfContents is undefined');
        }

        if (quest.is_writing) {
            message.stage = quest.current_book.volume > 0
                ? 'Encyclopedia'
                : 'Pre-Encyclopedia';
        } else {
            message.stage = 'Not Writing';
        }
    }
}
