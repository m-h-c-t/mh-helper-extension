import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

export class BristleWoodsRiftDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Bristle Woods Rift';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestRiftBristleWoods;

        if (!quest) {
            return;
        }

        // Track additional state
        const details: Record<string, unknown> = {
            has_hourglass: quest.items.rift_hourglass_stat_item.quantity >= 1,
            chamber_status: quest.chamber_status,
            cleaver_status: quest.cleaver_status,
        };

        // Buffs & debuffs are 'active', 'removed', or ""
        for (const [key, value] of Object.entries(quest.status_effects)) {
            details[`effect_${key}`] = value === 'active';
        }

        if (quest.chamber_name === 'Acolyte') {
            const obeliskCharged = quest.obelisk_percent === 100;

            details.obelisk_charged = obeliskCharged;
            details.acolyte_sand_drained = obeliskCharged && quest.acolyte_sand === 0;
        }

        return details;
    }
}
