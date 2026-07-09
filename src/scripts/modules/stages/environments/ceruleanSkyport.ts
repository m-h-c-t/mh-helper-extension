import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

/**
 * Cerulean Skyport Stager
 *
 * Stages
 * - Shipping - {type}
 * - Intercepting - {area}
 * - Docked
 */
export class CeruleanSkyportStager implements IStager {
    readonly environment: string = 'Cerulean Skyport';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestCeruleanSkyport;

        if (!quest) {
            throw new Error('QuestCeruleanSkyport is undefined');
        }

        let stage: string;
        if (quest.is_intercepting) {
            const area = quest.current_raid.name;
            // extra mice are added to the pool from area. helpful for mapping.
            stage = `Intercepting - ${area}`;
        } else if (quest.is_shipping) {
            const type = (() => {
                switch (quest.current_shipment.type) {
                    case 'gas_shipment':
                        return 'Atmo';
                    case 'cloudstone_shipment':
                        return 'Mining';
                    case 'spice_shipment':
                        return 'Spice';
                }
            })();
            stage = `Shipping - ${type}`;
        } else {
            stage = 'Docked';
        }

        message.stage = stage;
    }
}
