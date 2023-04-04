import * as hg from '@scripts/types/hg';
import * as mhct from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class SandDunesStager implements IStager {
    readonly environment: string = 'Sand Dunes';

    addStage(message: mhct.IntakeMessage, userPre: hg.User, userPost: hg.User, journal: unknown): void {
        const quest = userPre.quests.QuestSandDunes;
        if (!quest) {
            throw new Error('QuestSandDunes is undefined');
        }

        message.stage = (quest.minigame.has_stampede) ? "Stampede" : "No Stampede";
    }
}
