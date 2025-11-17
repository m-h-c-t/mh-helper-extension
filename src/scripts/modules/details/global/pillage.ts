import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IDetailer } from '../details.types';

export class PillageDetailer implements IDetailer {
    /**
     * Track whether a FTC resulted in a pillage, and if so, the damage dealt.
     */
    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        if (message.attracted && !message.caught && journal.render_data.css_class.includes('catchfailuredamage')) {
            const match = /Additionally, .+ ([\d,]+) .*(gold|bait|points)/.exec(journal.render_data.text);
            if (match?.length === 3) {
                return {
                    pillage_amount: parseInt(match[1].replace(/,/g, ''), 10),
                    pillage_type: match[2],
                };
            }
        }
    }
}
