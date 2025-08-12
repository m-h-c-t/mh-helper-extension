import type {JournalMarkup, User} from '@scripts/types/hg';
import type {IEnvironmentDetailer} from '../details.types';
import type {IntakeMessage} from '@scripts/types/mhct';

export class ClawShotCityDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Claw Shot City';

    /*
    * Track the poster type. Specific available mice require information from `treasuremap.php`.
    */
    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestRelicHunter;

        if (!quest?.maps) {
            return;
        }

        const map = quest.maps.find(m => m.name.endsWith("Wanted Poster"));
        if (map && !map.is_complete) {
            return {
                poster_type: map.name.replace(/Wanted Poster/i, "").trim(),
                at_boss: ((map.num_total - map.num_found) === 1),
            };
        }
    }
}
