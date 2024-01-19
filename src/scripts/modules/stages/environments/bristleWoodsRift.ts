import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class BristleWoodsRiftStager implements IStager {
    readonly environment: string = 'Bristle Woods Rift';

    /**
     * Report the current chamber name.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestRiftBristleWoods;

        if (!quest) {
            throw new Error('QuestRiftBristleWoods is undefined');
        }

        message.stage = quest.chamber_name;
        if (message.stage === "Rift Acolyte Tower") {
            message.stage = "Entrance";
        }
    }
}
