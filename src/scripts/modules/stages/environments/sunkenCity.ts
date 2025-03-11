import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class SunkenCityStager implements IStager {
    readonly environment: string = 'Sunken City';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestSunkenCity;

        if (!quest) {
            throw new Error('QuestSunkenCity is undefined');
        }

        if (!quest.is_diving) {
            message.stage = "Docked";
            return;
        }

        const depth = quest.distance;
        let stage = quest.zone_name;
        if (depth < 2000) {
            stage += " 0-2km";
        } else if (depth < 10000) {
            stage += " 2-10km";
        } else if (depth < 15000) {
            stage += " 10-15km";
        } else if (depth < 25000) {
            stage += " 15-25km";
        } else if (depth >= 25000) {
            stage += " 25km+";
        }

        message.stage = stage;
    }
}
