import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

export class FortRoxDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Fort Rox';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestFortRox;

        if (!quest) {
            return;
        }

        const ballista_level = parseInt(String(quest.fort.b.level), 10);
        const cannon_level = parseInt(String(quest.fort.c.level), 10);
        const details: Record<string, unknown> = {};

        if (quest.is_night) {
            Object.assign(details, {
                weakened_weremice: (ballista_level >= 1),
                can_autocatch_weremice: (ballista_level >= 2),
                autocatch_nightmancer: (ballista_level >= 3),

                weakened_critters: (cannon_level >= 1),
                can_autocatch_critters: (cannon_level >= 2),
                autocatch_nightfire: (cannon_level >= 3),
            });
        }

        // The mage tower's auto-catch can be applied during Day and Dawn phases, too.
        const tower_state = quest.tower_status.includes('inactive')
            ? 0
            : quest.fort.t.level;
        details.can_autocatch_any = (tower_state >= 2);

        return details;
    }
}
