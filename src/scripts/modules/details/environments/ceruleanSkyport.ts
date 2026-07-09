import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

/**
 * Cerulean Skyport Detailer
 *
 * Details
 * - port: location of the current shipment or raid
 */
export class CeruleanSkyportDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Cerulean Skyport';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestCeruleanSkyport;

        if (!quest) {
            return;
        }

        let location;
        if (quest.is_intercepting) {
            location = quest.current_raid.name;
        } else if (quest.is_shipping) {
            location = quest.current_shipment.location.name;
        } else {
            return;
        }

        const details: Record<string, unknown> = {
            port: location
        };

        return details;
    }
}
