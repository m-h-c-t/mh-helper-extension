import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type FortRoxStage, FortRoxStages} from '@scripts/types/hg/quests/fortRox';
import {type IStager} from '../stages.types';

export class FortRoxStager implements IStager {
    readonly environment: string = 'Fort Rox';

    readonly frStageToStage: Record<FortRoxStage, string> = {
        'stage_one':   'Twilight',
        'stage_two':   'Midnight',
        'stage_three': 'Pitch',
        'stage_four':  'Utter Darkness',
        'stage_five':  'First Light',
    };

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestFortRox;

        if (!quest) {
            throw new Error('QuestFortRox is undefined');
        }

        if (quest.is_lair) {
            message.stage = "Heart of the Meteor";
        } else if (quest.is_dawn) {
            message.stage = "Dawn";
        } else if (quest.is_day) {
            message.stage = "Day";
        } else if (quest.is_night && this.isValidStage(quest.current_stage)) {
            message.stage = this.frStageToStage[quest.current_stage];
        } else {
            throw new Error('Skipping unknown Fort Rox stage');
        }
    }

    private isValidStage(value: unknown): value is FortRoxStage {
        return typeof value === 'string' && FortRoxStages.includes(value as FortRoxStage);
    }
}
