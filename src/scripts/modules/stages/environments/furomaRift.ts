import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {DroidChargeLevels, DroidChargeLevel} from '@scripts/types/hg/quests';
import {type IStager} from '../stages.types';

export class FuromaRiftStager implements IStager {
    readonly environment: string = 'Furoma Rift';

    readonly chargeToStage: Record<DroidChargeLevel, string> = {
        'charge_level_one':   'Battery 1',
        'charge_level_two':   'Battery 2',
        'charge_level_three': 'Battery 3',
        'charge_level_four':  'Battery 4',
        'charge_level_five':  'Battery 5',
        'charge_level_six':   'Battery 6',
        'charge_level_seven': 'Battery 7',
        'charge_level_eight': 'Battery 8',
        'charge_level_nine':  'Battery 9',
        'charge_level_ten':   'Battery 10',
    };

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestRiftFuroma;

        if (!quest) {
            throw new Error('QuestRiftFuroma is undefined');
        }

        if (quest.view_state.includes("trainingGrounds")) {
            message.stage = "Outside";
        } else if (quest.view_state.includes("pagoda")) {

            const charge_level = quest.droid.charge_level;
            if (!this.isDroidChargeLevel(charge_level)) {
                throw new Error('Skipping unknown Furoma Rift droid state');
            }

            message.stage = this.chargeToStage[charge_level];
        }
    }

    private isDroidChargeLevel(value: unknown): value is DroidChargeLevel {
        return typeof value === 'string' && DroidChargeLevels.includes(value as DroidChargeLevel);
    }
}
