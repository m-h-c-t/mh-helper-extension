import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class BalacksCoveStager implements IStager {
    readonly environment: string = 'Balack\'s Cove';

    /**
     * Set the stage based on the tide. Reject hunts near tide intensity changes.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestBalacksCove;

        if (!quest) {
            throw new Error('QuestBalacksCove is undefined');
        }

        const tide = quest.tide.level;
        const direction = quest.tide.direction;
        const progress = quest.tide.percent;
        const imminent_state_change = (progress >= 99
                // Certain transitions do not change the tide intensity, and are OK to track.
                && !(tide === "low" && direction === "in")
                && !(tide === "high" && direction === "out"));
        if (!imminent_state_change && tide) {
            let tideStage = tide.charAt(0).toUpperCase() + tide.substr(1);
            if (tideStage === "Med") {
                tideStage = "Medium";
            }
            message.stage = `${tideStage} Tide`;
        } else {
            throw new Error('Skipping hunt due to imminent tide change');
        }
    }
}
