import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {MiceStates, type MiceState} from '@scripts/types/hg/quests/forewordFarm';
import {type IStager} from '../stages.types';

export class ForewordFarmStager implements IStager {
    readonly environment: string = 'Foreword Farm';

    readonly stateToStage: Record<MiceState, string> = {
        no_plants: 'No Plants',
        one_plant: 'One Plant',
        two_plants: 'Two Plants',
        three_plants: 'Three Plants',
        three_papyrus: 'Three Papyrus',
        boss: 'Boss',
    };

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestForewordFarm;

        if (!quest) {
            throw new Error('QuestForewordFarm is undefined');
        }

        if (!this.isValidState(quest.mice_state)) {
            throw new Error('Skipping hunt due to unknown mice state');
        }

        message.stage = this.stateToStage[quest.mice_state];
    }

    private isValidState(value: unknown): value is MiceState {
        return typeof value === 'string' && MiceStates.includes(value as MiceState);
    }
}
