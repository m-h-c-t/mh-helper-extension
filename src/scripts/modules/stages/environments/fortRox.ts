import { type User } from '@scripts/types/hg';
import { type FortRoxStage } from '@scripts/types/hg/quests/fortRox';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class FortRoxStager implements IStager {
    readonly environment: string = 'Fort Rox';

    readonly frStageToStage: Record<FortRoxStage, string> = {
        stage_one: 'Twilight',
        stage_two: 'Midnight',
        stage_three: 'Pitch',
        stage_four: 'Utter Darkness',
        stage_five: 'First Light',
    };

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestFortRox;

        if (!quest) {
            throw new Error('QuestFortRox is undefined');
        }

        switch (quest.current_phase) {
            case 'lair':
                message.stage = 'Heart of the Meteor';
                break;
            case 'dawn':
                message.stage = 'Dawn';
                break;
            case 'day':
                message.stage = 'Day';
                break;
            case 'night': {
                const stage: FortRoxStage = quest.current_stage;

                if (this.frStageToStage[stage] === undefined) {
                    throw new Error('Skipping unknown Fort Rox stage');
                }

                message.stage = this.frStageToStage[stage];
                break;
            }
            default:
                throw new Error('Skipping unknown Fort Rox stage');
        }
    }
}
