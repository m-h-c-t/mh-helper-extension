import type {JournalMarkup, User} from '@scripts/types/hg';
import type {IDetailer} from '../details.types';
import {IntakeMessage} from '@scripts/types/mhct';

export class LunarNewYearDetailer implements IDetailer {
    /**
     * Set a value for LNY bonus luck, if it can be determined. Otherwise flag LNY hunts.
     */
    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): LunarNewYearDetails | undefined {
        const quest = userPre.quests.QuestLunarNewYearLantern;
        if (quest) {
            return {
                is_lny_hunt: true,
                lny_luck: (quest.lantern_status.includes("noLantern") || !quest.is_lantern_active)
                    ? 0
                    : Math.min(50, Math.floor(quest.lantern_height / 10)),
            } as LunarNewYearDetails;
        }
    }
}

export interface LunarNewYearDetails {
    is_lny_hunt: boolean;
    lny_luck: number;
}
