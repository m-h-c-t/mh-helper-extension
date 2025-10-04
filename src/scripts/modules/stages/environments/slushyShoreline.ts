import { type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

export class SlushyShorelineStager implements IStager {
    readonly environment: string = 'Slushy Shoreline';

    /**
     * Report the Softserve Charm status.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const charm = userPre.trinket_name;

        message.stage = charm === 'Softserve Charm'
            ? 'Softserve'
            : 'Not Softserve';
    }
}
