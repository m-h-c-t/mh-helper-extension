import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

export class MuridaeMarketStager implements IStager {
    readonly environment: string = 'Muridae Market';

    /**
     * Report the Artisan Charm status.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const charm = userPre.trinket_name;

        message.stage = charm === "Artisan Charm"
            ? "Artisan"
            : "Not Artisan";
    }
}
