import type {JournalMarkup, User} from '@scripts/types/hg';
import type {IEnvironmentDetailer} from '../details.types';
import type {IntakeMessage} from '@scripts/types/mhct';

export class WhiskerWoodsRiftDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Whisker Woods Rift';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        // For Lactrodectus hunts, if MBW can be attracted (and is not guaranteed), record the rage state.
        if (message.cheese.id != 1646) {
            return;
        }

        const quest = userPre.quests.QuestRiftWhiskerWoods;

        if (quest == null) {
            return;
        }

        const rage = {
            clearing: quest.zones.clearing.level,
            tree: quest.zones.tree.level,
            lagoon: quest.zones.lagoon.level,
        };

        const total_rage = rage.clearing + rage.tree + rage.lagoon;
        if (total_rage < 150 && total_rage >= 75) {
            if (rage.clearing > 24 && rage.tree > 24 && rage.lagoon > 24) {
                return Object.assign(rage, {total_rage});
            }
        }
    }
}
