import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

export class ZugzwangsTowerDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Zugzwang\'s Tower';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        if (userPre.environment_name !== 'Zugzwang\'s Tower') {
            return;
        }

        /**
         * Report the progress on Technic and Mystic pieces. Piece progress is reported as 0 - 16 for each
         * side, where 0-7 -> only Pawns, 8/9 -> Pawns + Knights, and 16 = means King caught (only Pawns + Rooks available)
         */
        const zt = {
            amplifier: userPre.viewing_atts.zzt_amplifier,
            technic: userPre.viewing_atts.zzt_tech_progress,
            mystic: userPre.viewing_atts.zzt_mage_progress,
            cm_available: false,
        };

        zt.cm_available = (zt.technic === 16 || zt.mystic === 16) && message.cheese.id === 371;

        return zt;
    }
}
