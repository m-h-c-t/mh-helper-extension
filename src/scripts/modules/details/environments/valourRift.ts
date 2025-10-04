import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

export class ValourRiftDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Valour Rift';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestRiftValour;

        // Report active augmentations and floor number
        if (!quest) {
            return;
        }

        // active_augmentations is undefined outside of the tower
        if (quest.state === 'tower') {
            return {
                floor: quest.floor, // exact floor number (can be used to derive prestige and floor_type)
                // No compelling use case for the following 3 augments at the moment
                // super_siphon: !!quest.active_augmentations.ss, // active = true, inactive = false
                // string_stepping: !!quest.active_augmentations.sste,
                // elixir_rain: !!quest.active_augmentations.er,
            };
        }
    }
}
