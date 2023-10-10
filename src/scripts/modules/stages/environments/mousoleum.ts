import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class MousoleumStager implements IStager {
    readonly environment: string = 'Mousoleum';

    /* Add the "wall state" for Mousoleum hunts */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        if (!userPre.quests.QuestMousoleum) {
            throw new Error('QuestMousoleum is undefined');
        }

        message.stage = (userPre.quests.QuestMousoleum.has_wall) ? "Has Wall" : "No Wall";
    }
}
