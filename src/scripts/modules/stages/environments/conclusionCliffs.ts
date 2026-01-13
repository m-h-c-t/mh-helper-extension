import { type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class ConclusionCliffsStager implements IStager {
    readonly environment: string = 'Conclusion Cliffs';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestConclusionCliffs;

        if (!quest) {
            throw new Error('QuestConclusionCliffs is undefined');
        }

        const {story} = quest;

        if (!story.is_writing) {
            message.stage = 'Not Writing';
            return;
        }

        if (story.is_postscript) {
            // Check if there's a fantasy chapter in story_content for Fantasy Postscript
            const hasFantasyChapter = story.story_content.some(
                chapter => chapter.genre_type === 'fantasy'
            );

            if (hasFantasyChapter) {
                message.stage = 'Fantasy Postscript';
            } else {
                message.stage = 'Postscript';
            }
        } else {
            const genre = story.current_chapter.genre_type;
            // Capitalize first letter of genre for Title Case
            const genreCapitalized = genre.charAt(0).toUpperCase() + genre.slice(1);

            message.stage = `Writing ${genreCapitalized}`;
        }
    }
}
