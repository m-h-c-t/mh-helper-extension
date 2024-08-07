import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type ValourRiftEnvironmentAttributes, type ValourRiftState, ValourRiftStates} from '@scripts/types/hg/quests/valourRift';
import {type IStager} from '../stages.types';

export class ValourRiftStager implements IStager {
    readonly environment: string = 'Valour Rift';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const attrs = userPre.enviroment_atts;
        const quest = userPre.quests.QuestRiftValour;

        if (!quest) {
            throw new Error('QuestRiftValour is undefined');
        }

        if (!this.isValourRiftEnvironmentAttributes(attrs)) {
            throw new Error('Valour Rift environment attributes not found');
        }

        if (!this.isValidState(quest.state)) {
            throw new Error('Skipping hunt due to unknown Valour Rift state');
        }

        // Use phase here to narrow the viewing atts environment type. It only exists there and not the quest object.
        // At this point it's either: ValourRiftFarmingEnvironmentAttributes | ValourRiftTowerEnvironmentAttributes
        if (attrs.phase === 'tower') {

            const floor = quest.floor;
            let stageName;

            if (floor >= 1 && floor % 8 === 0) {
                stageName = "Eclipse";
            } else if (floor >= 1 && floor <= 7) {
                stageName = "Floors 1-7";
            } else if (floor >= 9 && floor <= 15) {
                stageName = "Floors 9-15";
            } else if (floor >= 17 && floor <= 23) {
                stageName = "Floors 17-23";
            } else if (floor >= 25) {
                stageName = "Floors 25-31+";
            }

            if ('tu' in attrs.active_augmentations && attrs.active_augmentations.tu) {
                stageName = "UU " + stageName;
            }

            message.stage = stageName;
        } else if (quest.state === 'farming') {
            message.stage = "Outside";
        }
    }

    private isValidState(value: unknown): value is ValourRiftState {
        return typeof value === 'string' && ValourRiftStates.includes(value as ValourRiftState);
    }

    private isValourRiftEnvironmentAttributes(value: unknown): value is ValourRiftEnvironmentAttributes {
        return typeof value === 'object' && (value as ValourRiftEnvironmentAttributes).phase != null;
    }
}
