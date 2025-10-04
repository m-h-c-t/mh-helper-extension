import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IStager } from '../stages.types';

export class FungalCavernStager implements IStager {
    readonly environment: string = 'Fungal Cavern';

    /**
     * One stage for if Gemology base is used, the other for if it's not used.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        if (userPre.base_name === 'Gemology Base') {
            message.stage = 'Gemology Base';
        } else {
            message.stage = 'Not Gemology';
        }
    }
}
