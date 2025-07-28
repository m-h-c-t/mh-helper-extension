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

        this.assertIsNormalQuestSandDunes(quest);

        message.stage = (quest.minigame.has_stampede) ? "Stampede" : "No Stampede";
    }

    private assertIsNormalQuestSandDunes(quest: hg.QuestSandDunes): asserts quest is hg.QuestSandDunes & { is_normal: true } {
        if (!quest.is_normal) {
            throw new Error('This stager is only for Sand Dunes and not the Sand Crypts');
        }
    }
}
