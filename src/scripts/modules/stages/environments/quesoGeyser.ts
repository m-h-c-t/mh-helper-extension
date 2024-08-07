import {type User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {QuesoGeyserState, QuesoGeyserStates} from '@scripts/types/hg/quests/quesoGeyser';
import {type IStager} from '../stages.types';

export class QuesoGeyserStager implements IStager {
    readonly environment: string = 'Queso Geyser';

    /**
     * Report the state of corks and eruptions
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestQuesoGeyser;

        if (!quest) {
            throw new Error('QuestQuesoGeyser is undefined');
        }

        if (!this.isValidState(quest.state)) {
            throw new Error('Skipping hunt due to unknown Queso Geyser state');
        }

        const state = quest.state;
        if (state === "collecting" || state === "claim") {
            message.stage = "Cork Collecting";
        } else if (state === "corked") {
            message.stage = "Pressure Building";
        } else if (state === "eruption") {
            // Tiny/Small/Medium/Large/Epic Eruption
            message.stage = quest.state_name;
        }
    }

    private isValidState(value: unknown): value is QuesoGeyserState {
        return typeof value === 'string' && QuesoGeyserStates.includes(value as QuesoGeyserState);
    }
}
