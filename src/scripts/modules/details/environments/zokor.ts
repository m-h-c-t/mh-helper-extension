import type {JournalMarkup, User} from '@scripts/types/hg';
import type {IEnvironmentDetailer} from '../details.types';
import type {IntakeMessage} from '@scripts/types/mhct';

export class ZokorDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Zokor';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        const quest = userPre.quests.QuestAncientCity;

        if (!quest) {
            return;
        }

        /*
        * For the level-3 districts, report whether the boss was defeated or not.
        * For the Minotaur lair, report the categorical label, number of catches, and meter width.
        */
        if (quest.boss.includes("hiddenDistrict")) {
            return {
                minotaur_label: quest.boss.replace(/hiddenDistrict/i, "").trim(),
                lair_catches: -(quest.countdown - 20),
                minotaur_meter: quest.width,
            };
        } else if (quest.district_tier === 3) {
            return {
                boss_defeated: (quest.boss === "defeated"),
            };
        }
    }
}
