import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class LivingGardenStager implements IStager {
    readonly environment: string = 'Living Garden';

    /**
     * Read the bucket / vial state to determine the stage for Living & Twisted garden.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestLivingGarden;
        if (!quest) {
            throw new Error('QuestLivingGarden is undefined');
        }

        const container_status = (quest.is_normal) ? quest.minigame.bucket_state : quest.minigame.vials_state;
        message.stage = (container_status === "dumped") ? "Pouring" : "Not Pouring";
    }
}
