import type {JournalMarkup, User} from '@scripts/types/hg';
import type {IDetailer} from '../details.types';

export class PillageDetailer implements IDetailer {
    /**
     * Track whether a FTC resulted in a pillage, and if so, the damage dealt.
     */
    addDetails(message: any, userPre: User, userPost: User, journal: JournalMarkup): {} | undefined {
        if (message.attracted && !message.caught && journal.render_data.css_class.includes('catchfailuredamage')) {
            const match = journal.render_data.text.match(/Additionally, .+ ([\d,]+) .*(gold|bait|points)/);
            if (match && match.length === 3) {
                return {
                    pillage_amount: parseInt(match[1].replace(/,/g,''), 10),
                    pillage_type: match[2],
                };
            }
        }
    }
}

