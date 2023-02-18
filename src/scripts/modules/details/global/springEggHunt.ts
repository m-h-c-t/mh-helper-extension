import type { JournalMarkup, User } from '@scripts/types/hg';
import type { IDetailer } from '../details.types';

export class SpringEggHuntDetailer implements IDetailer {
    /**
     * Record the Eggscavator Charge level, both before and after the hunt.
     */
    addDetails(message: any, userPre: User, userPost: User, journal: JournalMarkup): SpringEggHuntDetails | undefined {
        const quest = userPre.quests.QuestSpringHunt;
        const post_quest = userPost.quests.QuestSpringHunt;
        if (quest && post_quest) {
            return {
                is_egg_hunt: true,
                egg_charge_pre: parseInt(quest.charge_quantity, 10),
                egg_charge_post: parseInt(post_quest.charge_quantity, 10),
                can_double_eggs: (quest.charge_doubler === "active"),
            };
        }
    }

}

/**
 * Type describing the structure of SEH details added to message for intake
 */
export type SpringEggHuntDetails = {
    is_egg_hunt: boolean;
    egg_charge_pre: number;
    egg_charge_post: number;
    can_double_eggs: boolean;
}
