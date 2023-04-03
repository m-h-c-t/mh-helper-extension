import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class LabyrinthStager implements IStager {
    readonly environment: string = 'Labyrinth';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestLabyrinth;

        if (!quest) {
            throw new Error('QuestLabyrinth is undefined');
        }

        if (quest.status === "hallway") {
            const hallway = quest.hallway_name;
            // Remove first word (like Short)
            message.stage = hallway.substr(hallway.indexOf(" ") + 1).replace(/ hallway/i, '');
        } else {
            // Not recording intersections at this time.
            throw new Error('Not recording labyrinth intersections');
        }
    }
}
