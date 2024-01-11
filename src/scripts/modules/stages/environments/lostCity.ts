import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class LostCityStager implements IStager {
    readonly environment: string = 'Lost City';

    /**
     * Indicate whether or not the Cursed / Corrupt mouse is present
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        // TODO: Partially cursed, for Cursed City?
        const quest = userPre.quests.QuestLostCity;
        if (!quest) {
            throw new Error('QuestLostCity is undefined');
        }

        message.stage = (quest.minigame.is_cursed) ? "Cursed" : "Not Cursed";
    }
}
